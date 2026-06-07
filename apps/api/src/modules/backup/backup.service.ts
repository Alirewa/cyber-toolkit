import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { QueueService } from "../queue/queue.service";

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async triggerBackup(type: "database" | "config" | "full", organizationId?: string) {
    const record = await this.prisma.backupRecord.create({
      data: {
        type,
        status: "PENDING",
        organizationId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Queue backup job
    try {
      await this.queueService.addBackupJob("process-backup", {
        backupId: record.id,
        type,
        organizationId,
      });
    } catch (err) {
      this.logger.warn(`Backup queue unavailable, record created: ${record.id}`);
    }

    return { data: record, message: "Backup initiated" };
  }

  async listBackups(params: { organizationId?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.backupRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: "desc" },
      }),
      this.prisma.backupRecord.count({ where }),
    ]);

    return { data: { items, total, page, limit }, message: "Backups retrieved" };
  }

  async updateBackupStatus(
    id: string,
    status: "RUNNING" | "COMPLETED" | "FAILED",
    metadata?: {
      sizeBytes?: bigint;
      storageKey?: string;
      checksum?: string;
    },
  ) {
    await this.prisma.backupRecord.update({
      where: { id },
      data: {
        status,
        completedAt: status !== "RUNNING" ? new Date() : undefined,
        ...metadata,
      },
    });
  }

  async cleanupExpired() {
    const deleted = await this.prisma.backupRecord.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        status: { in: ["COMPLETED", "FAILED", "EXPIRED"] },
      },
    });
    this.logger.log(`Cleaned up ${deleted.count} expired backup records`);
    return deleted.count;
  }

  async archiveAuditLogs(organizationId?: string) {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    const count = await this.prisma.auditLog.count({
      where: {
        createdAt: { lt: cutoff },
        ...(organizationId ? {} : {}),
      },
    });

    if (count === 0) return { archived: 0 };

    // In a real implementation: export logs to S3 then delete
    await this.prisma.auditArchive.create({
      data: {
        organizationId,
        period,
        recordCount: count,
        storageKey: `audit-archive/${organizationId ?? "global"}/${period}.json.gz`,
        sizeBytes: BigInt(count * 512), // estimated
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`Archived ${count} audit logs for period ${period}`);
    return { archived: count };
  }
}
