import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { Role } from "@cyberlab/types";

// System permission definitions
export const SYSTEM_PERMISSIONS = [
  { resource: "users", action: "read" },
  { resource: "users", action: "write" },
  { resource: "users", action: "delete" },
  { resource: "users", action: "ban" },
  { resource: "roles", action: "read" },
  { resource: "roles", action: "assign" },
  { resource: "audit-logs", action: "read" },
  { resource: "notifications", action: "read" },
  { resource: "api-keys", action: "manage" },
  { resource: "feature-flags", action: "manage" },
  { resource: "modules", action: "manage" },
  { resource: "platform", action: "stats" },
];

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.SUPER_ADMIN]: SYSTEM_PERMISSIONS.map((p) => `${p.resource}:${p.action}`),
  [Role.ADMIN]: [
    "users:read", "users:write", "users:ban",
    "roles:read", "roles:assign",
    "audit-logs:read",
    "notifications:read",
    "feature-flags:manage",
    "platform:stats",
  ],
  [Role.MODERATOR]: [
    "users:read",
    "audit-logs:read",
    "notifications:read",
  ],
  [Role.USER]: [
    "notifications:read",
    "api-keys:manage",
  ],
};

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async seedPermissions(): Promise<void> {
    for (const perm of SYSTEM_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { resource_action: { resource: perm.resource, action: perm.action } },
        update: {},
        create: { resource: perm.resource, action: perm.action },
      });
    }

    // Assign permissions to roles
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await this.prisma.roleEntity.findUnique({ where: { name: roleName as Role } });
      if (!role) continue;

      for (const permStr of permissions) {
        const [resource, action] = permStr.split(":") as [string, string];
        const permission = await this.prisma.permission.findUnique({
          where: { resource_action: { resource, action } },
        });
        if (!permission) continue;

        await this.prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        });
      }
    }
  }

  async getRolePermissions(roleId: string): Promise<string[]> {
    const rps = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rps.map((rp) => `${rp.permission.resource}:${rp.permission.action}`);
  }
}
