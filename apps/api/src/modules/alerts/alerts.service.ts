import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AlertChannel, AlertSeverity, AlertStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { QueueService } from "../queue/queue.service";
import { WebsocketService } from "../websocket/websocket.service";
import type { CreateAlertDto, CreateAlertRuleDto } from "./dto/create-alert.dto";

interface AlertAction { channels: AlertChannel[]; emailTo?: string; webhookUrl?: string }
const PRIVATE_IP = /^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|::1|fd[0-9a-f]{2}:)/i;

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly queue: QueueService,
    private readonly ws: WebsocketService,
  ) {}

  // ── Rules ─────────────────────────────────────────────────────
  async createRule(userId: string, dto: CreateAlertRuleDto) {
    return this.prisma.alertRule.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        severity: dto.severity,
        conditions: dto.conditions as Prisma.InputJsonValue,
        action: dto.action as Prisma.InputJsonValue,
        cooldownMin: dto.cooldownMin ?? 60,
      },
    });
  }

  async updateRule(id: string, userId: string, dto: Partial<CreateAlertRuleDto>) {
    const rule = await this.prisma.alertRule.findUnique({ where: { id }, select: { userId: true } });
    if (!rule || rule.userId !== userId) throw new NotFoundException();
    return this.prisma.alertRule.update({ where: { id }, data: { ...dto } as never });
  }

  async deleteRule(id: string, userId: string) {
    const rule = await this.prisma.alertRule.findUnique({ where: { id }, select: { userId: true } });
    if (!rule || rule.userId !== userId) throw new NotFoundException();
    await this.prisma.alertRule.delete({ where: { id } });
  }

  async listRules(userId: string) {
    return this.prisma.alertRule.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Alert Creation & Delivery ─────────────────────────────────
  async fire(dto: CreateAlertDto): Promise<void> {
    // Cooldown check if rule-based
    if (dto.ruleId) {
      const rule = await this.prisma.alertRule.findUnique({ where: { id: dto.ruleId } });
      if (rule?.lastFiredAt) {
        const cooldownMs = (rule.cooldownMin ?? 60) * 60_000;
        if (Date.now() - rule.lastFiredAt.getTime() < cooldownMs) {
          this.logger.log(`Alert rule ${dto.ruleId} in cooldown — skipping`);
          return;
        }
      }
      if (rule) {
        await this.prisma.alertRule.update({ where: { id: dto.ruleId }, data: { lastFiredAt: new Date() } });
      }
    }

    const alert = await this.prisma.alert.create({
      data: {
        userId: dto.userId,
        ruleId: dto.ruleId,
        title: dto.title,
        message: dto.message,
        severity: dto.severity,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        status: AlertStatus.PENDING,
      },
    });

    await this.deliver(alert.id, dto);
    this.ws.emitAlertTriggered(dto.userId, { alertId: alert.id, title: dto.title, severity: dto.severity });
  }

  private async deliver(alertId: string, dto: CreateAlertDto) {
    const channels = dto.channels ?? [AlertChannel.IN_APP];

    for (const channel of channels) {
      const delivery = await this.prisma.alertDelivery.create({
        data: { alertId, channel, status: "PENDING", destination: channel === AlertChannel.EMAIL ? dto.emailTo : dto.webhookUrl },
      });

      try {
        if (channel === AlertChannel.IN_APP) {
          await this.notifications.create({
            userId: dto.userId,
            type: "ALERT",
            title: dto.title,
            message: dto.message,
            metadata: { alertId, severity: dto.severity },
          });
        } else if (channel === AlertChannel.EMAIL && dto.emailTo) {
          await this.queue.addEmailJob("alert-email", {
            to: dto.emailTo,
            subject: `[${dto.severity}] Alert: ${dto.title}`,
            html: `<p>${dto.message}</p><p>Severity: <strong>${dto.severity}</strong></p>`,
          });
        } else if (channel === AlertChannel.WEBHOOK && dto.webhookUrl) {
          // SSRF protection — block private IPs
          const url = new URL(dto.webhookUrl);
          if (PRIVATE_IP.test(url.hostname)) {
            throw new Error(`Webhook to private/internal host blocked: ${url.hostname}`);
          }
          await fetch(dto.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alertId, title: dto.title, message: dto.message, severity: dto.severity }),
            signal: AbortSignal.timeout(10_000),
          });
        }

        await this.prisma.alertDelivery.update({
          where: { id: delivery.id },
          data: { status: "DELIVERED", deliveredAt: new Date(), attempts: 1 },
        });
      } catch (err: unknown) {
        await this.prisma.alertDelivery.update({
          where: { id: delivery.id },
          data: { status: "FAILED", error: String(err), attempts: 1 },
        });
        this.logger.warn(`Alert delivery failed for ${channel}: ${String(err)}`);
      }
    }

    await this.prisma.alert.update({ where: { id: alertId }, data: { status: AlertStatus.DELIVERED } });
  }

  // ── Alert Status Management ───────────────────────────────────
  async listAlerts(userId: string, status?: AlertStatus, page = 1, limit = 20) {
    const where = { userId, ...(status ? { status } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        include: { rule: { select: { name: true } }, deliveries: { select: { channel: true, status: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.alert.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async acknowledge(id: string, userId: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id }, select: { userId: true } });
    if (!alert || alert.userId !== userId) throw new NotFoundException();
    return this.prisma.alert.update({ where: { id }, data: { status: AlertStatus.ACKNOWLEDGED, acknowledgedAt: new Date() } });
  }

  async resolve(id: string, userId: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id }, select: { userId: true } });
    if (!alert || alert.userId !== userId) throw new NotFoundException();
    return this.prisma.alert.update({ where: { id }, data: { status: AlertStatus.RESOLVED, resolvedAt: new Date() } });
  }

  /** Evaluate user's rules against a trigger event */
  async evaluateRules(userId: string, event: { type: string; severity?: AlertSeverity; data?: unknown }) {
    const rules = await this.prisma.alertRule.findMany({ where: { userId, isEnabled: true } });
    for (const rule of rules) {
      const conditions = (rule.conditions as unknown) as { type: string; value?: string };
      const action = (rule.action as unknown) as AlertAction;
      let matches = false;

      if (conditions.type === "finding_created" && event.type === "finding_created") matches = true;
      if (conditions.type === "finding_severity" && event.type === "finding_created" && event.severity === conditions.value) matches = true;
      if (conditions.type === "workflow_failed" && event.type === "workflow_failed") matches = true;

      if (matches) {
        await this.fire({
          userId,
          ruleId: rule.id,
          title: `[${rule.name}] triggered`,
          message: `Rule "${rule.name}" fired for event: ${event.type}`,
          severity: rule.severity as AlertSeverity,
          sourceType: event.type,
          channels: action.channels,
          emailTo: action.emailTo,
          webhookUrl: action.webhookUrl,
        });
      }
    }
  }
}
