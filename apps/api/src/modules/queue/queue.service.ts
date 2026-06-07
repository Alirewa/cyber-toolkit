import { Injectable, Logger } from "@nestjs/common";

/**
 * Personal-mode Queue — no Bull, no Redis. All jobs are logged but not queued.
 * Emails, notifications, and backups are skipped or logged in dev mode.
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  onModuleInit() {
    this.logger.log("QueueService running in no-op mode (no Redis/Bull needed)");
  }

  async addEmailJob(name: string, data: Record<string, unknown>): Promise<void> {
    this.logger.debug(`[EMAIL] Skipped job '${name}': ${JSON.stringify(data)}`);
  }

  async addNotificationJob(userId: string, data: Record<string, unknown>): Promise<void> {
    this.logger.debug(`[NOTIFICATION] Skipped for user ${userId}: ${JSON.stringify(data)}`);
  }

  async addBackupJob(name: string, data: Record<string, unknown>): Promise<void> {
    this.logger.debug(`[BACKUP] Skipped job '${name}': ${JSON.stringify(data)}`);
  }
}
