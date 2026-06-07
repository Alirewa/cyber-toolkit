import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 6000];
const LEVEL_NAMES = ["Newbie", "Apprentice", "Hacker", "Researcher", "Expert", "Elite", "Legend"];

@Injectable()
export class LabProgressService {
  private readonly logger = new Logger(LabProgressService.name);

  constructor(private readonly prisma: PrismaService) {}

  computeLevel(xp: number): number {
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= (LEVEL_THRESHOLDS[i] ?? 0)) {
        level = i + 1;
        break;
      }
    }
    return level;
  }

  getLevelName(level: number): string {
    return LEVEL_NAMES[level - 1] ?? "Legend";
  }

  getXpForNextLevel(xp: number): { current: number; next: number; levelName: string } {
    const level = this.computeLevel(xp);
    const next = LEVEL_THRESHOLDS[level] ?? xp;
    return { current: xp, next, levelName: this.getLevelName(level) };
  }

  async awardXp(userId: string, xp: number): Promise<{ totalXp: number; level: number; leveledUp: boolean }> {
    let score = await this.prisma.userScore.findUnique({ where: { userId } });
    if (!score) {
      score = await this.prisma.userScore.create({ data: { userId } });
    }

    const oldLevel = score.level;
    const newXp = score.totalXp + xp;
    const newLevel = this.computeLevel(newXp);

    await this.prisma.userScore.update({
      where: { userId },
      data: { totalXp: newXp, level: newLevel },
    });

    const leveledUp = newLevel > oldLevel;
    if (leveledUp) {
      this.logger.log(`User ${userId} leveled up to ${newLevel} (${this.getLevelName(newLevel)})`);
    }

    return { totalXp: newXp, level: newLevel, leveledUp };
  }

  async markLabCompleted(userId: string, labId: string, score: number, hintsUsed: number): Promise<void> {
    const existing = await this.prisma.userLabProgress.findUnique({
      where: { userId_labId: { userId, labId } },
    });

    if (existing) {
      await this.prisma.userLabProgress.update({
        where: { userId_labId: { userId, labId } },
        data: {
          isCompleted: true,
          bestScore: Math.max(existing.bestScore, score),
          attempts: { increment: 1 },
          hintsUsed: { increment: hintsUsed },
          completedAt: existing.completedAt ?? new Date(),
        },
      });
    } else {
      await this.prisma.userLabProgress.create({
        data: {
          userId,
          labId,
          isCompleted: true,
          bestScore: score,
          attempts: 1,
          hintsUsed,
          completedAt: new Date(),
        },
      });
    }

    await this.prisma.userScore.upsert({
      where: { userId },
      create: { userId, labsDone: 1 },
      update: { labsDone: { increment: 1 }, lastLabAt: new Date() },
    });
  }

  async incrementAttempt(userId: string, labId: string): Promise<void> {
    await this.prisma.userLabProgress.upsert({
      where: { userId_labId: { userId, labId } },
      create: { userId, labId, attempts: 1 },
      update: { attempts: { increment: 1 } },
    });
  }

  async getUserProgress(userId: string) {
    const progress = await this.prisma.userLabProgress.findMany({
      where: { userId },
      include: { lab: { select: { slug: true, name: true, difficulty: true, category: true, xpReward: true } } },
    });

    const score = await this.prisma.userScore.findUnique({ where: { userId } });

    const completed = progress.filter((p) => p.isCompleted).length;
    const total = await this.prisma.lab.count({ where: { isEnabled: true } });

    return {
      data: {
        score: score ?? { totalXp: 0, level: 1, labsDone: 0, streak: 0 },
        levelInfo: this.getXpForNextLevel(score?.totalXp ?? 0),
        progress,
        stats: {
          completed,
          total,
          percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      },
      message: "Progress retrieved",
    };
  }
}
