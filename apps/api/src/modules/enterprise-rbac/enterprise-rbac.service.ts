import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { OrgRole } from "@cyberlab/types";

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  [OrgRole.OWNER]: 7,
  [OrgRole.ADMIN]: 6,
  [OrgRole.SECURITY_MANAGER]: 5,
  [OrgRole.TEAM_LEAD]: 4,
  [OrgRole.ANALYST]: 3,
  [OrgRole.MEMBER]: 2,
  [OrgRole.READ_ONLY]: 1,
};

@Injectable()
export class EnterpriseRbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getMembership(userId: string, organizationId: string) {
    return this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }

  async requireOrgRole(userId: string, organizationId: string, minRole: OrgRole): Promise<void> {
    const member = await this.getMembership(userId, organizationId);
    if (!member) throw new ForbiddenException("Not a member of this organization");

    const userLevel = ROLE_HIERARCHY[member.role as OrgRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        `Requires at least ${minRole} role in this organization`,
      );
    }
  }

  async checkOrgPermission(
    userId: string,
    organizationId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const member = await this.getMembership(userId, organizationId);
    if (!member) return false;

    // Owners and Admins have full access
    if (member.role === OrgRole.OWNER || member.role === OrgRole.ADMIN) return true;

    // Resource-level permission matrix
    const permissions: Record<string, Record<string, OrgRole[]>> = {
      findings: {
        read: [OrgRole.SECURITY_MANAGER, OrgRole.TEAM_LEAD, OrgRole.ANALYST, OrgRole.MEMBER],
        write: [OrgRole.SECURITY_MANAGER, OrgRole.TEAM_LEAD, OrgRole.ANALYST],
        delete: [OrgRole.SECURITY_MANAGER],
      },
      workflows: {
        read: [OrgRole.SECURITY_MANAGER, OrgRole.TEAM_LEAD, OrgRole.ANALYST, OrgRole.MEMBER],
        write: [OrgRole.SECURITY_MANAGER, OrgRole.TEAM_LEAD],
        execute: [OrgRole.SECURITY_MANAGER, OrgRole.TEAM_LEAD, OrgRole.ANALYST],
      },
      members: {
        read: [OrgRole.SECURITY_MANAGER, OrgRole.TEAM_LEAD, OrgRole.ANALYST, OrgRole.MEMBER, OrgRole.READ_ONLY],
        write: [OrgRole.SECURITY_MANAGER, OrgRole.TEAM_LEAD],
      },
      settings: {
        read: [OrgRole.SECURITY_MANAGER, OrgRole.TEAM_LEAD],
        write: [],
      },
    };

    const allowedRoles = permissions[resource]?.[action] ?? [];
    return allowedRoles.includes(member.role as OrgRole);
  }

  async listOrgMembers(organizationId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, username: true, email: true, avatarUrl: true } },
      },
    });
  }

  getRoleHierarchy(): typeof ROLE_HIERARCHY {
    return ROLE_HIERARCHY;
  }
}
