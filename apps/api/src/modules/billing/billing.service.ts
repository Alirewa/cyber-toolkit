import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { PlanTier, SubscriptionStatus, BillingEventType } from "@cyberlab/types";

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async getPlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthlyUsd: "asc" },
    });
    return { data: plans, message: "Plans retrieved" };
  }

  async getSubscription(organizationId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: { organization: { select: { name: true, planTier: true } } },
    });
    return { data: sub, message: "Subscription retrieved" };
  }

  async createSubscription(organizationId: string, planTier: PlanTier, userId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { tier: planTier } });
    if (!plan) throw new NotFoundException("Plan not found");

    const existing = await this.prisma.subscription.findUnique({ where: { organizationId } });
    if (existing && existing.status === SubscriptionStatus.ACTIVE) {
      throw new ForbiddenException("Organization already has an active subscription. Use upgrade instead.");
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [sub] = await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: { organizationId },
        create: {
          organizationId,
          planTier,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          planTier,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      }),
      this.prisma.organization.update({
        where: { id: organizationId },
        data: { planTier },
      }),
      this.prisma.billingEvent.create({
        data: {
          organizationId,
          type: BillingEventType.SUBSCRIPTION_CREATED,
          metadata: { planTier, userId },
        },
      }),
    ]);

    await this.auditLogs.log({
      userId,
      action: "billing.subscription_created",
      resource: "organizations",
      resourceId: organizationId,
      metadata: { planTier },
    });

    return { data: sub, message: "Subscription created" };
  }

  async cancelSubscription(organizationId: string, userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { organizationId } });
    if (!sub) throw new NotFoundException("No active subscription found");

    const updated = await this.prisma.subscription.update({
      where: { organizationId },
      data: { cancelAtPeriodEnd: true },
    });

    await this.prisma.billingEvent.create({
      data: {
        organizationId,
        type: BillingEventType.SUBSCRIPTION_CANCELLED,
        metadata: { userId },
      },
    });

    await this.auditLogs.log({
      userId,
      action: "billing.subscription_cancelled",
      resource: "organizations",
      resourceId: organizationId,
    });

    return { data: updated, message: "Subscription will cancel at period end" };
  }

  async getBillingEvents(organizationId: string, params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.billingEvent.findMany({
        where: { organizationId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.billingEvent.count({ where: { organizationId } }),
    ]);

    return { data: { items, total, page, limit }, message: "Billing events retrieved" };
  }

  // ── Quota Checks ──────────────────────────────────────────────

  async checkQuota(
    organizationId: string,
    resource: "members" | "apiKeys" | "workflows" | "findings",
  ): Promise<void> {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException("Organization not found");

    const plan = await this.prisma.plan.findUnique({ where: { tier: org.planTier } });
    if (!plan) return; // no plan configured = no quota

    let currentCount = 0;
    let limit = 0;
    let resourceName = resource;

    switch (resource) {
      case "members":
        currentCount = await this.prisma.organizationMember.count({ where: { organizationId } });
        limit = plan.maxMembers;
        break;
      case "apiKeys":
        currentCount = await this.prisma.apiKey.count({ where: { organizationId, isActive: true } });
        limit = plan.maxApiKeys;
        break;
      case "workflows":
        currentCount = await this.prisma.workflow.count({ where: { userId: { in: [] } } }); // simplified
        limit = plan.maxWorkflows;
        break;
      case "findings":
        limit = plan.maxFindings;
        break;
    }

    if (currentCount >= limit) {
      await this.prisma.billingEvent.create({
        data: {
          organizationId,
          type: BillingEventType.QUOTA_EXCEEDED,
          metadata: { resource: resourceName, current: currentCount, limit },
        },
      });
      throw new ForbiddenException(
        `${resourceName} quota exceeded (${currentCount}/${limit}). Upgrade your plan to continue.`,
      );
    }
  }

  async getPlatformBillingOverview() {
    const [totalOrgs, byPlan, activeSubscriptions] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.organization.groupBy({
        by: ["planTier"],
        _count: { id: true },
        where: { deletedAt: null },
      }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    ]);

    return {
      data: { totalOrgs, byPlan, activeSubscriptions },
      message: "Platform billing overview retrieved",
    };
  }
}
