import {
  Injectable, NotFoundException, ForbiddenException,
  ConflictException, BadRequestException,
} from "@nestjs/common";
import { Prisma, TeamRole } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CommunityService } from "../community/community.service";
import type { CreateTeamDto } from "./dto/create-team.dto";

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly community: CommunityService,
  ) {}

  // ── Create / Get ─────────────────────────────────────────────
  async create(userId: string, dto: CreateTeamDto) {
    const existing = await this.prisma.team.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException("Slug already taken");

    const team = await this.prisma.team.create({
      data: {
        ...dto,
        members: { create: { userId, role: TeamRole.OWNER } },
      },
      include: { members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } } },
    });

    await this.logActivity(team.id, userId, "team_created");
    await this.community.addActivity(userId, userId, "team_joined", "team", team.id);
    return team;
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const where = {
      isPublic: true,
      deletedAt: null as null,
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        include: { _count: { select: { members: true } } },
        orderBy: { totalXp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.team.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findBySlug(slug: string, userId?: string) {
    const team = await this.prisma.team.findFirst({
      where: { slug, deletedAt: null },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, avatarUrl: true, bio: true, score: { select: { level: true, totalXp: true } } } } },
          orderBy: { joinedAt: "asc" },
        },
        activityLogs: {
          include: { user: { select: { username: true, avatarUrl: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { members: true } },
      },
    });
    if (!team) throw new NotFoundException("Team not found");

    const myRole = userId ? team.members.find(m => m.userId === userId)?.role ?? null : null;
    return { ...team, myRole };
  }

  // ── Members ──────────────────────────────────────────────────
  private async requireRole(teamId: string, userId: string, minRole: TeamRole) {
    const HIERARCHY: TeamRole[] = [TeamRole.VIEWER, TeamRole.MEMBER, TeamRole.ADMIN, TeamRole.OWNER];
    const member = await this.prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } } });
    if (!member) throw new ForbiddenException("Not a team member");
    if (HIERARCHY.indexOf(member.role) < HIERARCHY.indexOf(minRole)) throw new ForbiddenException("Insufficient role");
    return member;
  }

  async updateMemberRole(teamId: string, actorId: string, targetUserId: string, role: TeamRole) {
    await this.requireRole(teamId, actorId, TeamRole.ADMIN);
    if (role === TeamRole.OWNER) throw new BadRequestException("Use transfer ownership");
    const member = await this.prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: targetUserId } } });
    if (!member) throw new NotFoundException("Member not found");
    return this.prisma.teamMember.update({ where: { teamId_userId: { teamId, userId: targetUserId } }, data: { role } });
  }

  async removeMember(teamId: string, actorId: string, targetUserId: string) {
    if (actorId !== targetUserId) {
      await this.requireRole(teamId, actorId, TeamRole.ADMIN);
    }
    const member = await this.prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: targetUserId } } });
    if (!member) throw new NotFoundException();
    if (member.role === TeamRole.OWNER) throw new BadRequestException("Transfer ownership before leaving");
    await this.prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId: targetUserId } } });
    await this.logActivity(teamId, targetUserId, actorId === targetUserId ? "member_left" : "member_removed");
  }

  // ── Invitations ───────────────────────────────────────────────
  async inviteUser(teamId: string, invitedById: string, invitedUsername: string, role: TeamRole = TeamRole.MEMBER) {
    await this.requireRole(teamId, invitedById, TeamRole.ADMIN);
    const target = await this.prisma.user.findUnique({ where: { username: invitedUsername }, select: { id: true } });
    if (!target) throw new NotFoundException("User not found");

    const alreadyMember = await this.prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: target.id } } });
    if (alreadyMember) throw new ConflictException("Already a member");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return this.prisma.teamInvitation.create({
      data: { teamId, invitedById, invitedUserId: target.id, role, expiresAt },
    });
  }

  async respondToInvitation(invitationId: string, userId: string, accept: boolean) {
    const inv = await this.prisma.teamInvitation.findUnique({ where: { id: invitationId } });
    if (!inv || inv.invitedUserId !== userId) throw new NotFoundException();
    if (inv.status !== "PENDING") throw new BadRequestException("Already responded");
    if (inv.expiresAt < new Date()) throw new BadRequestException("Invitation expired");

    await this.prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
    });

    if (accept) {
      await this.prisma.teamMember.create({ data: { teamId: inv.teamId, userId, role: inv.role } });
      await this.logActivity(inv.teamId, userId, "member_joined");
      await this.community.addActivity(userId, userId, "team_joined", "team", inv.teamId);
    }

    return { accepted: accept };
  }

  async getMyInvitations(userId: string) {
    return this.prisma.teamInvitation.findMany({
      where: { invitedUserId: userId, status: "PENDING", expiresAt: { gt: new Date() } },
      include: { team: { select: { id: true, slug: true, name: true, avatarUrl: true, _count: { select: { members: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Activity Log ──────────────────────────────────────────────
  private async logActivity(teamId: string, userId: string, type: string, metadata?: Record<string, unknown>) {
    await this.prisma.teamActivityLog.create({
      data: { teamId, userId, type, metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined },
    });
  }

  async addXp(teamId: string, amount: number) {
    await this.prisma.team.update({ where: { id: teamId }, data: { totalXp: { increment: amount } } });
  }
}
