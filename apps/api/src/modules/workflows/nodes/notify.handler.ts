import { Injectable } from "@nestjs/common";
import type { INodeHandler, WorkflowNode, ExecutionContext, NodeResult } from "./node-handler.interface";
import { NotificationsService } from "../../notifications/notifications.service";
import { resolveVar } from "./workflow-vars";

@Injectable()
export class NotifyNodeHandler implements INodeHandler {
  constructor(
    private readonly notifications: NotificationsService,
  ) {}

  async execute(node: WorkflowNode, ctx: ExecutionContext): Promise<NodeResult> {
    const title = resolveVar(String(node.config["title"] ?? "Workflow notification"), ctx);
    const message = resolveVar(String(node.config["message"] ?? "Workflow step completed"), ctx);

    await this.notifications.create({
      userId: ctx.userId,
      type: "WORKFLOW",
      title,
      message,
    });

    return {
      success: true,
      output: { notified: true, title },
      logs: [{ level: "INFO", message: `Notification sent: ${title}` }],
    };
  }
}
