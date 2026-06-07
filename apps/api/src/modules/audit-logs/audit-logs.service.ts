import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import type { CreateAuditLogDto } from "./dto/create-audit-log.dto";
import type { PaginationQuery } from "@cyberlab/types";

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: dto.userId ?? null,
        action: dto.action,
        resource: dto.resource ?? null,
        resourceId: dto.resourceId ?? null,
        metadata: (dto.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
      },
    });
  }

  async findAll(query: PaginationQuery & { userId?: string; action?: string; resource?: string; from?: string; to?: string }) {
    const { page = 1, limit = 50, userId, action, resource, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (userId) where["userId"] = userId;
    if (action) where["action"] = { contains: action, mode: "insensitive" };
    if (resource) where["resource"] = resource;
    if (from ?? to) {
      where["createdAt"] = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, username: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      message: "Audit logs retrieved",
    };
  }

  async findForUser(userId: string, query: PaginationQuery) {
    return this.findAll({ ...query, userId });
  }
}
