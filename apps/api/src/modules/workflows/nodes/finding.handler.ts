import { Injectable } from "@nestjs/common";
import { FindingSeverity } from "@prisma/client";
import type { INodeHandler, WorkflowNode, ExecutionContext, NodeResult } from "./node-handler.interface";
import { FindingsService } from "../../findings/findings.service";
import { AlertsService } from "../../alerts/alerts.service";
import { resolveVar } from "./workflow-vars";

@Injectable()
export class FindingNodeHandler implements INodeHandler {
  constructor(
    private readonly findings: FindingsService,
    private readonly alerts: AlertsService,
  ) {}

  async execute(node: WorkflowNode, ctx: ExecutionContext): Promise<NodeResult> {
    const title = resolveVar(String(node.config["title"] ?? "Automated Finding"), ctx);
    const description = resolveVar(String(node.config["description"] ?? "Created by workflow"), ctx);
    const severity = (node.config["severity"] as FindingSeverity | undefined) ?? FindingSeverity.MEDIUM;
    const target = node.config["target"] ? resolveVar(String(node.config["target"]), ctx) : undefined;

    const finding = await this.findings.createFromWorkflow(
      ctx.userId,
      { title, description, severity, target, tags: ["workflow-generated"] },
      ctx.workflowId,
    );

    // Fire alert rules for finding_created event (map FindingSeverity → AlertSeverity; INFO has no equivalent)
    const alertSeverityMap: Record<string, string | undefined> = {
      CRITICAL: "CRITICAL", HIGH: "HIGH", MEDIUM: "MEDIUM", LOW: "LOW", INFO: undefined,
    };
    const alertSev = alertSeverityMap[severity];
    if (alertSev) {
      await this.alerts.evaluateRules(ctx.userId, { type: "finding_created", severity: alertSev as never });
    }

    return {
      success: true,
      output: { findingId: finding.id, severity: finding.severity },
      logs: [{ level: "INFO", message: `Created finding: ${title} [${severity}]`, data: { findingId: finding.id } }],
    };
  }
}
