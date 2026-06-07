import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { WebsocketService } from "../websocket/websocket.service";

export type AchievementEvent =
  | { type: "lab_completed"; labSlug: string; labId: string; hintsUsed: number; score: number; maxScore: number; timeSpentMs?: number }
  | { type: "level_up"; newLevel: number }
  | { type: "daily_check" };

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ws: WebsocketService,
  ) {}

  async checkAndAward(userId: string, event: AchievementEvent): Promise<void> {
    const allAchievements = await this.prisma.achievement.findMany();
    const earned = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const earnedIds = new Set(earned.map((e) => e.achievementId));

    const toAward: string[] = [];

    for (const achievement of allAchievements) {
      if (earnedIds.has(achievement.id)) continue;
      if (await this.shouldAward(userId, achievement.slug, event)) {
        toAward.push(achievement.id);
      }
    }

    for (const achievementId of toAward) {
      const achievement = allAchievements.find((a) => a.id === achievementId)!;
      await this.prisma.userAchievement.create({
        data: { userId, achievementId },
      });

      if (achievement.xpReward > 0) {
        await this.prisma.userScore.upsert({
          where: { userId },
          create: { userId, totalXp: achievement.xpReward },
          update: { totalXp: { increment: achievement.xpReward } },
        });
      }

      this.ws.emitAchievementUnlocked(userId, {
        achievement: {
          slug: achievement.slug,
          name: achievement.name,
          icon: achievement.icon,
          xpReward: achievement.xpReward,
        },
      });

      this.logger.log(`Achievement unlocked for ${userId}: ${achievement.slug}`);
    }
  }

  private async shouldAward(userId: string, slug: string, event: AchievementEvent): Promise<boolean> {
    switch (slug) {
      case "first-blood":
        return event.type === "lab_completed" && (await this.prisma.userLabProgress.count({ where: { userId, isCompleted: true } })) === 1;

      case "perfect-score":
        return event.type === "lab_completed" && event.score === event.maxScore;

      case "hint-free":
        return event.type === "lab_completed" && event.hintsUsed === 0;

      case "speed-hacker":
        return event.type === "lab_completed" && (event.timeSpentMs ?? Infinity) < 10 * 60 * 1000;

      case "level-up": {
        if (event.type !== "level_up") return false;
        return event.newLevel >= 3;
      }

      case "xss-slayer": {
        if (event.type !== "lab_completed") return false;
        const xssLabs = await this.prisma.lab.findMany({ where: { category: "XSS" }, select: { id: true } });
        const completedXss = await this.prisma.userLabProgress.count({
          where: { userId, isCompleted: true, labId: { in: xssLabs.map((l) => l.id) } },
        });
        return completedXss >= xssLabs.length && xssLabs.length > 0;
      }

      case "jwt-jedi": {
        if (event.type !== "lab_completed") return false;
        const jwtLabs = await this.prisma.lab.findMany({ where: { category: "JWT" }, select: { id: true } });
        const completedJwt = await this.prisma.userLabProgress.count({
          where: { userId, isCompleted: true, labId: { in: jwtLabs.map((l) => l.id) } },
        });
        return completedJwt >= jwtLabs.length && jwtLabs.length > 0;
      }

      case "sql-sorcerer": {
        if (event.type !== "lab_completed") return false;
        const sqliLabs = await this.prisma.lab.findMany({ where: { category: "SQL_INJECTION" }, select: { id: true } });
        const completedSqli = await this.prisma.userLabProgress.count({
          where: { userId, isCompleted: true, labId: { in: sqliLabs.map((l) => l.id) } },
        });
        return completedSqli >= sqliLabs.length && sqliLabs.length > 0;
      }

      case "completionist": {
        const total = await this.prisma.lab.count({ where: { isEnabled: true } });
        const done = await this.prisma.userLabProgress.count({ where: { userId, isCompleted: true } });
        return done >= total && total > 0;
      }

      case "on-fire": {
        // 3 labs completed in the last 24 hours
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentCount = await this.prisma.userLabProgress.count({
          where: { userId, isCompleted: true, completedAt: { gte: dayAgo } },
        });
        return recentCount >= 3;
      }

      default:
        return false;
    }
  }
}
