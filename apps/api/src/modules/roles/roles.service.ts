import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { Role } from "@cyberlab/types";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.roleEntity.findMany({ include: { rolePermissions: { include: { permission: true } } } });
  }

  async getRoleByName(name: Role) {
    return this.prisma.roleEntity.findUnique({ where: { name } });
  }

  async getRoleByNameOrThrow(name: Role) {
    const role = await this.getRoleByName(name);
    if (!role) throw new NotFoundException(`Role ${name} not found`);
    return role;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((ur) => ur.role.name as Role);
  }

  async assignRole(userId: string, role: Role, assignedBy?: string): Promise<void> {
    const roleEntity = await this.getRoleByNameOrThrow(role);
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: roleEntity.id } },
      update: { assignedBy },
      create: { userId, roleId: roleEntity.id, assignedBy },
    });
  }

  async removeRole(userId: string, role: Role): Promise<void> {
    const roleEntity = await this.getRoleByNameOrThrow(role);
    await this.prisma.userRole.deleteMany({
      where: { userId, roleId: roleEntity.id },
    });
  }

  async hasRole(userId: string, ...roles: Role[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return roles.some((r) => userRoles.includes(r));
  }

  async seedSystemRoles(): Promise<void> {
    const roles = [
      { name: Role.SUPER_ADMIN, description: "Full platform access", isSystem: true },
      { name: Role.ADMIN, description: "Administrative access", isSystem: true },
      { name: Role.MODERATOR, description: "Content moderation access", isSystem: true },
      { name: Role.USER, description: "Standard user access", isSystem: true },
    ];

    for (const role of roles) {
      await this.prisma.roleEntity.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: role,
      });
    }
  }
}
