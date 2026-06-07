import { Injectable, Logger, NotFoundException, ForbiddenException } from "@nestjs/common";
import { ExecutionStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { WebsocketService } from "../websocket/websocket.service";
import { AlertsService } from "../alerts/alerts.service";
import { WorkflowEngineService } from "./workflow-engine.service";
import type { ExecutionContext, WorkflowEdge, WorkflowNode, NodeState } from "./nodes/node-handler.interface";

// Personal mode — Bull queue removed. Workflows execute synchronously (fire-and-forget).
@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ws: WebsocketService,
    private readonly alerts: AlertsService,
    private readonly engine: WorkflowEngineService,
  ) {}

  async run(workflowId: string, userId: string, input?: Record<string, unknown>) {
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) throw new NotFoundException("Workflow not found");
    if (workflow.userId !== userId) throw new ForbiddenException("Access denied");
    if (!workflow.isEnabled) throw new ForbiddenException("Workflow is disabled");

    const nodes = (workflow.nodes as unknown) as WorkflowNode[];
    const triggerNode = nodes.find(n => n.type === "TRIGGER");
    if (!triggerNode) throw new Error("Workflow has no TRIGGER node");

    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        userId,
        status: ExecutionStatus.PENDING,
        triggerType: workflow.triggerType,
        input: input as Prisma.InputJsonValue | undefined ?? undefined,
        nodeStates: {
          "__input__": { status: "completed", output: input ?? {}, completedAt: new Date().toISOString() },
        } as Prisma.InputJsonValue,
      },
    });

    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: { lastRunAt: new Date(), lastRunStatus: ExecutionStatus.RUNNING },
    });

    this.logger.log(`Started execution ${execution.id} for workflow ${workflowId}`);

    // Personal mode: execute inline (fire-and-forget in the background)
    void this.runInline(execution.id, workflowId, userId, nodes, (workflow.edges as unknown) as WorkflowEdge[], triggerNode.id);

    return execution;
  }

  /** Execute workflow steps synchronously in a loop (no queue). */
  private async runInline(
    executionId: string,
    workflowId: string,
    userId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    startNodeId: string,
  ) {
    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status: ExecutionStatus.RUNNING },
    });

    let currentNodeId: string | null = startNodeId;
    const MAX_STEPS = 100; // safety limit
    let steps = 0;

    while (currentNodeId && steps < MAX_STEPS) {
      steps++;
      const node = nodes.find(n => n.id === currentNodeId);
      if (!node) {
        await this.markFailed(executionId, `Node ${currentNodeId} not found`);
        return;
      }

      // Check if cancelled
      const exec = await this.getWorkflowAndExecution(executionId);
      if (exec?.status === ExecutionStatus.CANCELLED) {
        this.logger.log(`Execution ${executionId} cancelled — stopping`);
        return;
      }

      const nodeStates = ((exec?.nodeStates ?? {}) as unknown) as Record<string, NodeState>;

      await this.updateNodeState(executionId, currentNodeId, {
        status: "running",
        output: {},
        startedAt: new Date().toISOString(),
      });

      const ctx: ExecutionContext = {
        executionId,
        workflowId,
        userId,
        nodeStates,
        edges,
        nodes,
      };

      let result;
      try {
        result = await this.engine.executeNode(node, ctx);
      } catch (err: unknown) {
        const errMsg = String(err);
        await this.updateNodeState(executionId, currentNodeId, {
          status: "failed",
          output: {},
          error: errMsg,
          completedAt: new Date().toISOString(),
        });
        await this.appendLog(executionId, currentNodeId, "ERROR", `Node ${currentNodeId} threw: ${errMsg}`);
        await this.markFailed(executionId, `Node ${node.type}[${currentNodeId}] failed: ${errMsg}`);
        return;
      }

      for (const log of result.logs) {
        await this.appendLog(executionId, currentNodeId, log.level, log.message, log.data);
      }

      await this.updateNodeState(executionId, currentNodeId, {
        status: result.success ? "completed" : "failed",
        output: result.output,
        completedAt: new Date().toISOString(),
      });

      this.ws.emitWorkflowStepCompleted(userId, {
        executionId,
        nodeId: currentNodeId,
        nodeType: node.type,
        success: result.success,
      });

      if (!result.success) {
        await this.markFailed(executionId, `Node ${node.type} failed`);
        return;
      }

      currentNodeId = this.engine.getNextNodeId(currentNodeId, edges, result.nextEdgeLabel);
    }

    // All nodes done
    const lastExec = await this.getWorkflowAndExecution(executionId);
    const nodeStates = ((lastExec?.nodeStates ?? {}) as unknown) as Record<string, unknown>;
    const lastNodeState = Object.values(nodeStates).pop() as Record<string, unknown> | undefined;
    await this.markCompleted(executionId, (lastNodeState?.["output"] as Record<string, unknown>) ?? {});
  }

  async cancel(executionId: string, userId: string) {
    const exec = await this.prisma.workflowExecution.findUnique({ where: { id: executionId } });
    if (!exec || exec.userId !== userId) throw new NotFoundException();
    if (exec.status !== ExecutionStatus.RUNNING && exec.status !== ExecutionStatus.PENDING) {
      throw new ForbiddenException("Only RUNNING or PENDING executions can be cancelled");
    }
    return this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status: ExecutionStatus.CANCELLED, completedAt: new Date() },
    });
  }

  async getExecutions(workflowId: string, userId: string, page = 1, limit = 20) {
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId }, select: { userId: true } });
    if (!workflow || workflow.userId !== userId) throw new NotFoundException();

    const [items, total] = await Promise.all([
      this.prisma.workflowExecution.findMany({
        where: { workflowId },
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.workflowExecution.count({ where: { workflowId } }),
    ]);
    return { items, total, page, limit };
  }

  async getExecution(execId: string, userId: string) {
    const exec = await this.prisma.workflowExecution.findUnique({
      where: { id: execId },
      include: { logs: { orderBy: { createdAt: "asc" } }, workflow: { select: { name: true, nodes: true, edges: true } } },
    });
    if (!exec || exec.userId !== userId) throw new NotFoundException();
    return exec;
  }

  async markCompleted(executionId: string, output: Record<string, unknown>) {
    const exec = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      select: { workflowId: true, userId: true, startedAt: true },
    });
    if (!exec) return;

    const durationMs = Date.now() - exec.startedAt.getTime();
    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.COMPLETED,
        completedAt: new Date(),
        durationMs,
        output: output as Prisma.InputJsonValue,
      },
    });
    await this.prisma.workflow.update({
      where: { id: exec.workflowId },
      data: { lastRunStatus: ExecutionStatus.COMPLETED },
    });

    const workflow = await this.prisma.workflow.findUnique({ where: { id: exec.workflowId }, select: { name: true } });
    this.ws.emitWorkflowCompleted(exec.userId, { executionId, workflowName: workflow?.name ?? "", durationMs });
  }

  async markFailed(executionId: string, errorMessage: string) {
    const exec = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      select: { workflowId: true, userId: true, startedAt: true },
    });
    if (!exec) return;

    const durationMs = Date.now() - exec.startedAt.getTime();
    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status: ExecutionStatus.FAILED, completedAt: new Date(), durationMs, errorMessage },
    });
    await this.prisma.workflow.update({
      where: { id: exec.workflowId },
      data: { lastRunStatus: ExecutionStatus.FAILED },
    });

    const workflow = await this.prisma.workflow.findUnique({ where: { id: exec.workflowId }, select: { name: true } });
    this.ws.emitWorkflowFailed(exec.userId, { executionId, workflowName: workflow?.name ?? "", error: errorMessage });

    await this.alerts.evaluateRules(exec.userId, { type: "workflow_failed" });
  }

  async updateNodeState(executionId: string, nodeId: string, state: Record<string, unknown>) {
    const exec = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      select: { nodeStates: true },
    });
    if (!exec) return;
    const nodeStates = (exec.nodeStates as Record<string, unknown>) ?? {};
    nodeStates[nodeId] = state;
    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: { nodeStates: nodeStates as Prisma.InputJsonValue },
    });
  }

  async appendLog(executionId: string, nodeId: string | null, level: string, message: string, data?: unknown) {
    await this.prisma.executionLog.create({
      data: { executionId, nodeId, level, message, data: data as Prisma.InputJsonValue | undefined },
    });
  }

  async getWorkflowAndExecution(executionId: string) {
    return this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: { workflow: true },
    });
  }
}
