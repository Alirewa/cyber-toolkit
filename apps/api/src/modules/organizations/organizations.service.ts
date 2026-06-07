import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import type { CreateOrganizationDto } from "./dto/create-organization.dto";
import type { UpdateOrganizationDto } from "./dto/update-organization.dto";
import type { InviteMemberDto } from "./dto/invite-member.dto";
import type { UpdateTenantSettingsDto } from "./dto/update-tenant-settings.dto";
import { OrgRole } from "@cyberlab/types";

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────

  async create(dto: CreateOrganizationDto, creatorId: string) {
    const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException("Organization slug already taken");

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        domain: dto.domain,
        logoUrl: dto.logoUrl,
        members: {
          create: { userId: creatorId, role: OrgRole.OWNER },
        },
        tenantSettings: { create: {} },
      },
    });

    await this.auditLogs.log({
      userId: creatorId,
      action: "organization.created",
      resource: "organizations",
      resourceId: org.id,
      metadata: { name: org.name, slug: org.slug },
    });

    return { data: org, message: "Organization created" };
  }

  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        include: { _count: { select: { members: true } }, subscription: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return { data: { items, total, page, limit }, message: "Organizations retrieved" };
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findFirst({
      where: { slug, deletedAt: null },
      include: {
        _count: { select: { members: true } },
        subscription: true,
        tenantSettings: true,
      },
    });
    if (!org) throw new NotFoundException("Organization not found");
    return { data: org, message: "Organization retrieved" };
  }

  async update(orgId: string, dto: UpdateOrganizationDto, userId: string) {
    const org = await this.prisma.organization.findFirst({ where: { id: orgId, deletedAt: null } });
    if (!org) throw new NotFoundException("Organization not found");

    const updated = await this.prisma.organization.update({ where: { id: orgId }, data: dto });

    await this.auditLogs.log({
      userId,
      action: "organization.updated",
      resource: "organizations",
      resourceId: orgId,
    });

    return { data: updated, message: "Organization updated" };
  }

  async softDelete(orgId: string, userId: string) {
    const org = await this.prisma.organization.findFirst({ where: { id: orgId, deletedAt: null } });
    if (!org) throw new NotFoundException("Organization not found");

    await this.prisma.organization.update({ where: { id: orgId }, data: { deletedAt: new Date() } });

    await this.auditLogs.log({
      userId,
      action: "organization.deleted",
      resource: "organizations",
      resourceId: orgId,
    });

    return { data: null, message: "Organization deleted" };
  }

  // ── Membership ────────────────────────────────────────────────

  async listMembers(orgId: string) {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, username: true, email: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: "asc" },
    });
    return { data: members, message: "Members retrieved" };
  }

  async inviteMember(orgId: string, dto: InviteMemberDto, inviterId: string) {
    if (!dto.username && !dto.email) {
      throw new ConflictException("Provide either username or email");
    }

    const user = dto.username
      ? await this.prisma.user.findUnique({ where: { username: dto.username } })
      : await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) throw new NotFoundException("User not found");

    const already = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });
    if (already) throw new ConflictException("User is already a member");

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { _count: { select: { members: true } } },
    });
    if (!org) throw new NotFoundException("Organization not found");
    if (org._count.members >= org.maxMembers) {
      throw new ForbiddenException("Organization member limit reached. Upgrade your plan.");
    }

    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: dto.role ?? OrgRole.MEMBER,
        invitedById: inviterId,
      },
      include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
    });

    await this.auditLogs.log({
      userId: inviterId,
      action: "organization.member_added",
      resource: "organizations",
      resourceId: orgId,
      metadata: { targetUserId: user.id, role: dto.role ?? OrgRole.MEMBER },
    });

    return { data: member, message: "Member added" };
  }

  async updateMemberRole(orgId: string, userId: string, role: OrgRole, actorId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!member) throw new NotFoundException("Member not found");
    if (member.role === OrgRole.OWNER && role !== OrgRole.OWNER) {
      throw new ForbiddenException("Cannot change owner role");
    }

    const updated = await this.prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId: orgId, userId } },
      data: { role },
    });

    await this.auditLogs.log({
      userId: actorId,
      action: "organization.member_role_changed",
      resource: "organizations",
      resourceId: orgId,
      metadata: { targetUserId: userId, oldRole: member.role, newRole: role },
    });

    return { data: updated, message: "Member role updated" };
  }

  async removeMember(orgId: string, userId: string, actorId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!member) throw new NotFoundException("Member not found");
    if (member.role === OrgRole.OWNER) throw new ForbiddenException("Cannot remove the owner");

    await this.prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });

    await this.auditLogs.log({
      userId: actorId,
      action: "organization.member_removed",
      resource: "organizations",
      resourceId: orgId,
      metadata: { targetUserId: userId },
    });

    return { data: null, message: "Member removed" };
  }

  // ── Tenant Settings ───────────────────────────────────────────

  async getTenantSettings(orgId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { organizationId: orgId } });
    if (!settings) throw new NotFoundException("Settings not found");
    return { data: settings, message: "Settings retrieved" };
  }

  async updateTenantSettings(orgId: string, dto: UpdateTenantSettingsDto, userId: string) {
    const settings = await this.prisma.tenantSettings.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId, ...dto },
      update: dto,
    });

    await this.auditLogs.log({
      userId,
      action: "organization.settings_updated",
      resource: "organizations",
      resourceId: orgId,
    });

    return { data: settings, message: "Settings updated" };
  }

  // ── Membership check ──────────────────────────────────────────

  async getMembership(orgId: string, userId: string) {
    return this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
  }

  async getUserOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: { _count: { select: { members: true } }, subscription: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
    return { data: memberships, message: "User organizations retrieved" };
  }
}
