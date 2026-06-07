import {
  Body, Controller, Delete, Get, Param, Post, Query,
} from "@nestjs/common";
import { LabsService } from "./labs.service";
import { LabValidationService } from "./lab-validation.service";
import { LabProgressService } from "./lab-progress.service";
import { SubmitLabDto } from "./dto/submit-lab.dto";
import { QueryLabsDto } from "./dto/query-labs.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Role } from "@cyberlab/types";
import type { JwtPayload } from "@cyberlab/types";

@Controller("labs")
export class LabsController {
  constructor(
    private readonly labsService: LabsService,
    private readonly validationService: LabValidationService,
    private readonly progressService: LabProgressService,
  ) {}

  // ── Catalogue ────────────────────────────────────────────────
  @Get()
  findAll(@Query() query: QueryLabsDto, @CurrentUser() user?: JwtPayload) {
    return this.labsService.findAll(query, user?.sub);
  }

  @Get("learning-paths")
  @Public()
  getLearningPaths() {
    return this.labsService.getLearningPaths();
  }

  @Get("leaderboard")
  @Public()
  getLeaderboard() {
    return this.labsService.getLeaderboard();
  }

  @Get("my-progress")
  getMyProgress(@CurrentUser() user: JwtPayload) {
    return this.progressService.getUserProgress(user.sub);
  }

  @Get("my-achievements")
  async getMyAchievements(@CurrentUser() user: JwtPayload) {
    const achievements = await this.labsService["prisma"].userAchievement.findMany({
      where: { userId: user.sub },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    });
    return { data: achievements, message: "Achievements retrieved" };
  }

  @Get("scores/me")
  getMyScore(@CurrentUser() user: JwtPayload) {
    return this.labsService.getUserScore(user.sub);
  }

  @Get("submissions")
  getMySubmissions(
    @CurrentUser() user: JwtPayload,
    @Query() query: { page?: number; limit?: number; labSlug?: string },
  ) {
    return this.validationService.getMySubmissions(user.sub, query);
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string, @CurrentUser() user?: JwtPayload) {
    return this.labsService.findBySlug(slug, user?.sub);
  }

  // ── Session management ───────────────────────────────────────
  @Post(":slug/start")
  startSession(@Param("slug") slug: string, @CurrentUser() user: JwtPayload) {
    return this.labsService.startSession(user.sub, slug);
  }

  @Delete(":slug/session")
  resetSession(@Param("slug") slug: string, @CurrentUser() user: JwtPayload) {
    return this.labsService.resetSession(user.sub, slug);
  }

  // ── Hints ────────────────────────────────────────────────────
  @Get(":slug/hints/:key")
  getHint(@Param("slug") slug: string, @Param("key") key: string, @CurrentUser() user: JwtPayload) {
    return this.labsService.getHint(user.sub, slug, key);
  }

  // ── Submission ───────────────────────────────────────────────
  @Post(":slug/submit")
  async submit(
    @Param("slug") slug: string,
    @Body() dto: SubmitLabDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.validationService.validate(user.sub, slug, dto.answers, dto.sessionId);
  }
}
