import { Injectable, NotFoundException } from "@nestjs/common";
import { ModerationStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async report(reporterId: string, dto: { resourceType: string; resourceId: string; reason: string; details?: string }) {
    return this.prisma.communityReport.create({
      data: { reporterId, ...dto },
    });
  }

  async getQueue(page = 1, limit = 20, status: ModerationStatus = ModerationStatus.PENDING) {
    const [items, total] = await Promise.all([
      this.prisma.communityReport.findMany({
        where: { status },
        include: {
          reporter: { select: { id: true, username: true } },
          reviewedBy: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.communityReport.count({ where: { status } }),
    ]);
    return { items, total, page, limit };
  }

  async review(reportId: string, reviewerId: string, dto: { status: ModerationStatus; reviewNotes?: string }) {
    const report = await this.prisma.communityReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException();

    return this.prisma.communityReport.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        reviewNotes: dto.reviewNotes,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }
}
