import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiManagementService } from "./api-management.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtPayload } from "@cyberlab/types";

@Controller("api-management")
export class ApiManagementController {
  constructor(private readonly service: ApiManagementService) {}

  @Get("usage")
  async getUsage(
    @CurrentUser() user: JwtPayload,
    @Query("days") days?: string,
    @Query("orgId") orgId?: string,
  ) {
    return this.service.getUsageSummary({
      userId: user.sub,
      organizationId: orgId,
      days: days ? parseInt(days) : undefined,
    });
  }

  @Get("usage/daily")
  async getDailyUsage(
    @CurrentUser() user: JwtPayload,
    @Query("days") days?: string,
    @Query("orgId") orgId?: string,
  ) {
    return this.service.getDailyUsage({
      organizationId: orgId,
      days: days ? parseInt(days) : undefined,
    });
  }

  @Get("quota/:apiKeyId")
  async getQuota(@Param("apiKeyId") apiKeyId: string) {
    return this.service.getQuotaStatus(apiKeyId);
  }

  @Get("top-users")
  async getTopUsers(
    @Query("orgId") orgId: string,
    @Query("days") days?: string,
  ) {
    return this.service.getTopUsers(orgId, days ? parseInt(days) : undefined);
  }
}
