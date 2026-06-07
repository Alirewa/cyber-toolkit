import {
  Controller, Get, Post, Delete, Patch, Param, Query, Body,
  Request, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { TeamRole } from "@prisma/client";
import { TeamsService } from "./teams.service";
import { CreateTeamDto } from "./dto/create-team.dto";
import { IsEnum, IsString } from "class-validator";

class InviteDto { @IsString() username!: string; @IsEnum(TeamRole) role: TeamRole = TeamRole.MEMBER; }
class RespondDto { constructor(public accept: boolean) {} }
class UpdateRoleDto { @IsEnum(TeamRole) role!: TeamRole; }

@Controller("teams")
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get()
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("search") search?: string,
  ) {
    return this.service.findAll(page, Math.min(limit, 50), search);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateTeamDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get("invitations/me")
  getMyInvitations(@Request() req: { user: { id: string } }) {
    return this.service.getMyInvitations(req.user.id);
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string, @Request() req: { user?: { id: string } }) {
    return this.service.findBySlug(slug, req.user?.id);
  }

  @Post(":slug/invite")
  invite(@Request() req: { user: { id: string } }, @Param("slug") slug: string, @Body() dto: InviteDto) {
    return this.service["prisma"].team.findFirst({ where: { slug, deletedAt: null }, select: { id: true } })
      .then((t: { id: string } | null) => {
        if (!t) throw new Error("Team not found");
        return this.service.inviteUser(t.id, req.user.id, dto.username, dto.role);
      });
  }

  @Post("invitations/:id/respond")
  respond(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: RespondDto) {
    return this.service.respondToInvitation(id, req.user.id, dto.accept);
  }

  @Delete(":slug/members/:userId")
  removeMember(@Request() req: { user: { id: string } }, @Param("slug") slug: string, @Param("userId") userId: string) {
    return this.service["prisma"].team.findFirst({ where: { slug, deletedAt: null }, select: { id: true } })
      .then((t: { id: string } | null) => {
        if (!t) throw new Error("Team not found");
        return this.service.removeMember(t.id, req.user.id, userId);
      });
  }

  @Patch(":slug/members/:userId/role")
  updateRole(@Request() req: { user: { id: string } }, @Param("slug") slug: string, @Param("userId") userId: string, @Body() dto: UpdateRoleDto) {
    return this.service["prisma"].team.findFirst({ where: { slug, deletedAt: null }, select: { id: true } })
      .then((t: { id: string } | null) => {
        if (!t) throw new Error("Team not found");
        return this.service.updateMemberRole(t.id, req.user.id, userId, dto.role);
      });
  }
}
