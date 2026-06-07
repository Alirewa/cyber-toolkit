import { Injectable, Logger } from "@nestjs/common";
import { Prisma, ReputationAction } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

const POINTS_MAP: Record<ReputationAction, number> = {
  LAB_COMPLETED:        10,
  WRITEUP_PUBLISHED:    20,
  DISCUSSION_CREATED:    5,
  DISCUSSION_HELPFUL:   15,
  REPLY_HELPFUL:        10,
  MENTORSHIP_GIVEN:     30,
  TEAM_PARTICIPATION:    5,
  ACHIEVEMENT_EARNED:   10,
  FIRST_BLOOD:          50,
  STREAK_BONUS:         20,
};

const TIER_THRESHOLDS = [
  { min: 0,    name: "Newcomer",      badge: "🌱" },
  { min: 50,   name: "Explorer",      badge: "🔍" },
  { min: 150,  name: "Hunter",        badge: "🎯" },
  { min: 350,  name: "Hacker",        badge: "💻" },
  { min: 700,  name: "Expert",        badge: "⚡" },
  { min: 1200, name: "Elite",         badge: "🛡️" },
  { min: 2000, name: "Master",        badge: "🔥" },
  { min: 3500, name: "Legend",        badge: "👑" },
];

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async award(userId: string, action: ReputationAction, metadata?: Record<string, unknown>): Promise<number> {
    const points = POINTS_MAP[action] ?? 0;
    if (points === 0) return 0;

    await this.prisma.$transaction([
      this.prisma.reputationLog.create({
        data: { userId, action, points, metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined },
      }),
      this.prisma.userProfileExtension.upsert({
        where: { userId },
        create: { userId, reputation: points },
        update: { reputation: { increment: points } },
      }),
    ]);

    this.logger.log(`Awarded ${points} rep to ${userId} for ${action}`);
    return points;
  }

  async getReputation(userId: string): Promise<number> {
    const profile = await this.prisma.userProfileExtension.findUnique({ where: { userId }, select: { reputation: true } });
    return profile?.reputation ?? 0;
  }

  getTier(reputation: number) {
    let tier = TIER_THRESHOLDS[0];
    for (const t of TIER_THRESHOLDS) {
      if (reputation >= t.min) tier = t;
    }
    return tier;
  }

  async getLeaderboard(limit = 50) {
    const rows = await this.prisma.userProfileExtension.findMany({
      where: { isPublic: true },
      orderBy: { reputation: "desc" },
      take: limit,
      select: {
        userId: true,
        reputation: true,
        user: { select: { username: true, avatarUrl: true } },
      },
    });
    return rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      username: r.user.username,
      avatarUrl: r.user.avatarUrl,
      reputation: r.reputation,
      tier: this.getTier(r.reputation),
    }));
  }
}
