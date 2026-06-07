import {
  Body, Controller, Delete, Get, Param, Post, Query,
} from "@nestjs/common";
import { ToolsService } from "./tools.service";
import { ToolRunsService } from "./tool-runs.service";
import { ToolExecutorService } from "./tool-executor.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ExecuteToolDto } from "./dto/execute-tool.dto";
import { QueryRunsDto } from "./dto/query-runs.dto";
import { SaveTargetDto } from "./dto/save-target.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtPayload } from "@cyberlab/types";

@Controller("tools")
export class ToolsController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly toolRunsService: ToolRunsService,
    private readonly toolExecutorService: ToolExecutorService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  // ── Tool catalogue ──────────────────────────────────────────────────
  @Get()
  findAll() {
    return this.toolsService.findAll();
  }

  @Get("runs")
  getMyRuns(@CurrentUser() user: JwtPayload, @Query() query: QueryRunsDto) {
    return this.toolRunsService.findByUser(user.sub, query);
  }

  @Get("saved-targets")
  getSavedTargets(@CurrentUser() user: JwtPayload) {
    return this.toolsService.getSavedTargets(user.sub);
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.toolsService.findBySlug(slug);
  }

  // ── Execution ───────────────────────────────────────────────────────
  @Post(":slug/run")
  async executeRun(
    @Param("slug") slug: string,
    @Body() dto: ExecuteToolDto,
    @CurrentUser() user: JwtPayload,
  ) {
    void this.auditLogs.log({
      userId: user.sub,
      action: "tool.run",
      resource: "tools",
      resourceId: slug,
      metadata: { toolSlug: slug },
    });

    return this.toolExecutorService.execute(user.sub, slug, dto.input);
  }

  // ── Run management ──────────────────────────────────────────────────
  @Get("runs/:id")
  getRun(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.toolRunsService.findOne(id, user.sub);
  }

  @Delete("runs/:id")
  async deleteRun(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    await this.toolRunsService.delete(id, user.sub);
    return { data: null, message: "Run deleted" };
  }

  // ── Saved Targets ───────────────────────────────────────────────────
  @Post("saved-targets")
  saveTarget(@CurrentUser() user: JwtPayload, @Body() dto: SaveTargetDto) {
    return this.toolsService.saveTarget(user.sub, dto);
  }

  @Delete("saved-targets/:id")
  async deleteSavedTarget(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    await this.toolsService.deleteSavedTarget(user.sub, id);
    return { data: null, message: "Target deleted" };
  }
}
