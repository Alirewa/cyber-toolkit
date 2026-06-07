import { Controller, Get, Post, Patch, Param, Query, Body, Request, ParseIntPipe, DefaultValuePipe, UseGuards } from "@nestjs/common";
import { ModerationStatus } from "@prisma/client";
import { Role } from "@cyberlab/types";
import { ModerationService } from "./moderation.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

class ReportDto {
  @IsString() resourceType!: string;
  @IsString() resourceId!: string;
  @IsString() @MaxLength(100) reason!: string;
  @IsOptional() @IsString() @MaxLength(1000) details?: string;
}

class ReviewDto {
  @IsEnum(ModerationStatus) status!: ModerationStatus;
  @IsOptional() @IsString() reviewNotes?: string;
}

@Controller("moderation")
export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  @Post("report")
  report(@Request() req: { user: { id: string } }, @Body() dto: ReportDto) {
    return this.service.report(req.user.id, dto);
  }

  @Get("queue")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  getQueue(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("status") status: ModerationStatus = ModerationStatus.PENDING,
  ) {
    return this.service.getQueue(page, limit, status);
  }

  @Patch("queue/:id")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  review(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: ReviewDto) {
    return this.service.review(id, req.user.id, dto);
  }
}
