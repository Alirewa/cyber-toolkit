import {
  Controller, Get, Post, Patch, Delete, Param, Query,
  Body, Request, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { AlertStatus } from "@prisma/client";
import { AlertsService } from "./alerts.service";
import { CreateAlertRuleDto } from "./dto/create-alert.dto";

@Controller()
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  // ── Alert Rules ─────────────────────────────────────────────
  @Post("alert-rules")
  createRule(@Request() req: { user: { id: string } }, @Body() dto: CreateAlertRuleDto) {
    return this.service.createRule(req.user.id, dto);
  }

  @Get("alert-rules")
  listRules(@Request() req: { user: { id: string } }) {
    return this.service.listRules(req.user.id);
  }

  @Patch("alert-rules/:id")
  updateRule(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: Partial<CreateAlertRuleDto>) {
    return this.service.updateRule(id, req.user.id, dto);
  }

  @Delete("alert-rules/:id")
  deleteRule(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.deleteRule(id, req.user.id);
  }

  // ── Alerts ───────────────────────────────────────────────────
  @Get("alerts")
  listAlerts(
    @Request() req: { user: { id: string } },
    @Query("status") status?: AlertStatus,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.service.listAlerts(req.user.id, status, page, limit);
  }

  @Patch("alerts/:id/acknowledge")
  acknowledge(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.acknowledge(id, req.user.id);
  }

  @Patch("alerts/:id/resolve")
  resolve(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.resolve(id, req.user.id);
  }
}
