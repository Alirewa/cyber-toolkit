import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ReportType } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import type { GenerateReportDto } from "./dto/generate-report.dto";

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(userId: string, dto: GenerateReportDto) {
    const from = dto.config?.dateFrom ? new Date(dto.config.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = dto.config?.dateTo ? new Date(dto.config.dateTo) : new Date();

    let content: Record<string, unknown> = {};

    switch (dto.type) {
      case ReportType.TOOL_SUMMARY:
        content = await this.buildToolSummary(userId, from, to);
        break;
      case ReportType.FINDING_SUMMARY:
        content = await this.buildFindingSummary(userId, from, to, dto.config?.severity, dto.config?.status);
        break;
      case ReportType.PROGRESS:
        content = await this.buildProgressReport(userId);
        break;
      case ReportType.TEAM_ACTIVITY:
        content = await this.buildTeamActivityReport(userId, dto.teamId, from, to);
        break;
      case ReportType.WORKFLOW:
        content = await this.buildWorkflowReport(userId, from, to);
        break;
      default:
        content = { message: "Custom report — no template applied" };
    }

    return this.prisma.report.create({
      data: {
        userId,
        teamId: dto.teamId,
        title: dto.title,
        type: dto.type,
        content: content as Prisma.InputJsonValue,
        templateId: dto.templateId,
        status: "READY",
      },
    });
  }

  private async buildToolSummary(userId: string, from: Date, to: Date) {
    const runs = await this.prisma.toolRun.findMany({
      where: { userId, createdAt: { gte: from, lte: to } },
      include: { tool: { select: { name: true, slug: true, category: true } } },
      orderBy: { createdAt: "desc" },
    });

    const total = runs.length;
    const completed = runs.filter(r => r.status === "COMPLETED").length;
    const failed = runs.filter(r => r.status === "FAILED").length;
    const byCategory: Record<string, number> = {};
    const byTool: Record<string, number> = {};

    for (const run of runs) {
      byCategory[run.tool.category] = (byCategory[run.tool.category] ?? 0) + 1;
      byTool[run.tool.name] = (byTool[run.tool.name] ?? 0) + 1;
    }

    const avgExecMs = runs.filter(r => r.executionMs).reduce((s, r) => s + (r.executionMs ?? 0), 0) / (completed || 1);

    return { total, completed, failed, successRate: total ? Math.round((completed / total) * 100) : 0, avgExecMs: Math.round(avgExecMs), byCategory, byTool, period: { from, to } };
  }

  private async buildFindingSummary(userId: string, from: Date, to: Date, severity?: string, status?: string) {
    const where = {
      userId,
      createdAt: { gte: from, lte: to },
      ...(severity ? { severity: severity as never } : {}),
      ...(status ? { status: status as never } : {}),
    };

    const findings = await this.prisma.finding.findMany({
      where,
      select: { id: true, title: true, severity: true, status: true, createdAt: true, resolvedAt: true, target: true },
    });

    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const f of findings) {
      bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
      byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;
    }

    const avgResolutionMs = findings
      .filter(f => f.resolvedAt)
      .reduce((s, f) => s + (f.resolvedAt!.getTime() - f.createdAt.getTime()), 0) /
      (findings.filter(f => f.resolvedAt).length || 1);

    return { total: findings.length, bySeverity, byStatus, avgResolutionDays: Math.round(avgResolutionMs / 86_400_000), findings, period: { from, to } };
  }

  private async buildProgressReport(userId: string) {
    const score = await this.prisma.userScore.findUnique({ where: { userId } });
    const completedLabs = await this.prisma.userLabProgress.count({ where: { userId, isCompleted: true } });
    const totalLabs = await this.prisma.lab.count({ where: { isEnabled: true } });
    const achievements = await this.prisma.userAchievement.count({ where: { userId } });
    const reputation = await this.prisma.userProfileExtension.findUnique({ where: { userId }, select: { reputation: true } });

    return {
      level: score?.level ?? 1,
      totalXp: score?.totalXp ?? 0,
      labsDone: score?.labsDone ?? 0,
      streak: score?.streak ?? 0,
      completedLabs,
      totalLabs,
      completionRate: totalLabs ? Math.round((completedLabs / totalLabs) * 100) : 0,
      achievements,
      reputation: reputation?.reputation ?? 0,
    };
  }

  private async buildTeamActivityReport(userId: string, teamId?: string, from?: Date, to?: Date) {
    if (!teamId) return { error: "teamId required for team activity report" };

    const member = await this.prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } } });
    if (!member) return { error: "Not a member of this team" };

    const logs = await this.prisma.teamActivityLog.findMany({
      where: { teamId, ...(from && to ? { createdAt: { gte: from, lte: to } } : {}) },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const members = await this.prisma.teamMember.findMany({
      where: { teamId },
      include: { user: { select: { username: true, score: { select: { totalXp: true, level: true } } } } },
    });

    const team = await this.prisma.team.findUnique({ where: { id: teamId }, select: { name: true, totalXp: true } });

    return { team, members: members.length, memberDetails: members, activityLogs: logs, period: { from, to } };
  }

  private async buildWorkflowReport(userId: string, from: Date, to: Date) {
    const executions = await this.prisma.workflowExecution.findMany({
      where: { userId, startedAt: { gte: from, lte: to } },
      include: { workflow: { select: { name: true } } },
    });

    const total = executions.length;
    const completed = executions.filter(e => e.status === "COMPLETED").length;
    const failed = executions.filter(e => e.status === "FAILED").length;
    const avgDuration = executions.filter(e => e.durationMs).reduce((s, e) => s + (e.durationMs ?? 0), 0) / (completed || 1);

    const byWorkflow: Record<string, { runs: number; completed: number; failed: number }> = {};
    for (const exec of executions) {
      const name = exec.workflow.name;
      if (!byWorkflow[name]) byWorkflow[name] = { runs: 0, completed: 0, failed: 0 };
      byWorkflow[name].runs++;
      if (exec.status === "COMPLETED") byWorkflow[name].completed++;
      if (exec.status === "FAILED") byWorkflow[name].failed++;
    }

    return { total, completed, failed, successRate: total ? Math.round((completed / total) * 100) : 0, avgDurationMs: Math.round(avgDuration), byWorkflow, period: { from, to } };
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { userId },
        orderBy: { generatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.report.count({ where: { userId } }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string, userId: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report || report.userId !== userId) throw new NotFoundException("Report not found");
    return report;
  }

  async getTemplates(userId: string) {
    return this.prisma.reportTemplate.findMany({
      where: { OR: [{ isSystem: true }, { userId }] },
      orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
    });
  }

  async createTemplate(userId: string, dto: { name: string; type: ReportType; description?: string; config: Record<string, unknown> }) {
    return this.prisma.reportTemplate.create({
      data: { userId, name: dto.name, description: dto.description, type: dto.type, config: dto.config as Prisma.InputJsonValue, isSystem: false },
    });
  }
}
