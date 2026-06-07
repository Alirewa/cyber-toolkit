import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtPayload } from "@cyberlab/types";
import { Role, PlanTier } from "@cyberlab/types";
import { IsEnum } from "class-validator";

class CreateSubscriptionDto {
  @IsEnum(PlanTier)
  planTier!: PlanTier;
}

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("billing/plans")
  async getPlans() {
    return this.billingService.getPlans();
  }

  @Get("organizations/:orgId/billing/subscription")
  async getSubscription(@Param("orgId") orgId: string) {
    return this.billingService.getSubscription(orgId);
  }

  @Post("organizations/:orgId/billing/subscription")
  async createSubscription(
    @Param("orgId") orgId: string,
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.billingService.createSubscription(orgId, dto.planTier, user.sub);
  }

  @Delete("organizations/:orgId/billing/subscription")
  async cancelSubscription(
    @Param("orgId") orgId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.billingService.cancelSubscription(orgId, user.sub);
  }

  @Get("organizations/:orgId/billing/events")
  async getBillingEvents(
    @Param("orgId") orgId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.billingService.getBillingEvents(orgId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get("admin/billing/overview")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getPlatformOverview() {
    return this.billingService.getPlatformBillingOverview();
  }
}
