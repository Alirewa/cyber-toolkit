import { Injectable } from "@nestjs/common";
import { ReportType } from "@prisma/client";
import type { INodeHandler, WorkflowNode, ExecutionContext, NodeResult } from "./node-handler.interface";
import { ReportingService } from "../../reporting/reporting.service";

@Injectable()
export class ReportNodeHandler implements INodeHandler {
  constructor(private readonly reporting: ReportingService) {}

  async execute(node: WorkflowNode, ctx: ExecutionContext): Promise<NodeResult> {
    const type = (node.config["reportType"] as ReportType | undefined) ?? ReportType.TOOL_SUMMARY;
    const title = String(node.config["title"] ?? `Auto Report — ${new Date().toLocaleDateString()}`);

    const report = await this.reporting.generate(ctx.userId, { title, type });

    return {
      success: true,
      output: { reportId: report.id, type: report.type },
      logs: [{ level: "INFO", message: `Generated report: ${title}`, data: { reportId: report.id } }],
    };
  }
}
