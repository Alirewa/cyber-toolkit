import {
  Injectable, Logger, NotFoundException,
  BadRequestException, ForbiddenException,
} from "@nestjs/common";
import { Prisma, ScheduledJobType } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

// Minimum interval: 5 minutes (security: prevent abuse via high-frequency crons)
const MIN_CRON_INTERVAL_MS = 5 * 60 * 1000;
const MAX_JOBS_PER_USER = 50;

/** Parse a cron expression and estimate minimum interval in ms (best-effort). */
function estimateCronIntervalMs(cron: string): number {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) throw new BadRequestException("Invalid cron expression — must have 5 fields");
  if (parts[0] === "*") return 60_000;
  if (parts[1] === "*") return 60_000;
  return MIN_CRON_INTERVAL_MS + 1;
}

// Personal mode — Bull queue removed. Jobs are stored in DB but not auto-scheduled.
// You can trigger workflows manually from the UI.
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: {
    name: string;
    type: ScheduledJobType;
    cronExpression: string;
    timezone?: string;
    config: Record<string, unknown>;
    workflowId?: string;
  }) {
    const count = await this.prisma.scheduledJob.count({ where: { userId, isEnabled: true } });
    if (count >= MAX_JOBS_PER_USER) throw new BadRequestException(`Maximum ${MAX_JOBS_PER_USER} scheduled jobs per user`);

    const interval = estimateCronIntervalMs(dto.cronExpression);
    if (interval < MIN_CRON_INTERVAL_MS) {
      throw new BadRequestException("Cron expression must not run more often than every 5 minutes");
    }

    const job = await this.prisma.scheduledJob.create({
      data: {
        userId,
        workflowId: dto.workflowId,
        name: dto.name,
        type: dto.type,
        config: dto.config as Prisma.InputJsonValue,
        cronExpression: dto.cronExpression,
        timezone: dto.timezone ?? "UTC",
        isEnabled: true,
      },
    });

    this.logger.log(`Scheduled job created: ${job.id} (cron: ${dto.cronExpression}) — note: auto-execution disabled in personal mode`);
    return job;
  }

  async findAll(userId: string) {
    return this.prisma.scheduledJob.findMany({
      where: { userId },
      include: { workflow: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, userId: string, dto: { isEnabled?: boolean; cronExpression?: string }) {
    const job = await this.prisma.scheduledJob.findUnique({ where: { id } });
    if (!job || job.userId !== userId) throw new NotFoundException();

    if (dto.cronExpression && dto.cronExpression !== job.cronExpression) {
      const interval = estimateCronIntervalMs(dto.cronExpression);
      if (interval < MIN_CRON_INTERVAL_MS) {
        throw new BadRequestException("Cron expression must not run more often than every 5 minutes");
      }
    }

    return this.prisma.scheduledJob.update({
      where: { id },
      data: {
        ...(dto.cronExpression ? { cronExpression: dto.cronExpression } : {}),
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
      },
    });
  }

  async delete(id: string, userId: string) {
    const job = await this.prisma.scheduledJob.findUnique({ where: { id } });
    if (!job || job.userId !== userId) throw new NotFoundException();
    if (job.userId !== userId) throw new ForbiddenException();

    await this.prisma.scheduledJob.delete({ where: { id } });
    return { deleted: true };
  }
}
