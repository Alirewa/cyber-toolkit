import { Injectable, NotFoundException, ConflictException, ForbiddenException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ReputationService } from "../reputation/reputation.service";

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationService,
  ) {}

  // ── Public Profile ───────────────────────────────────────────
  async getPublicProfile(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, avatarUrl: true, bio: true,
        createdAt: true,
        profileExtension: true,
        score: { select: { totalXp: true, level: true, labsDone: true, streak: true } },
        achievements: {
          include: { achievement: true },
          orderBy: { earnedAt: "desc" },
          take: 8,
        },
        _count: {
          select: { followers: true, following: true, writeups: true, discussions: true },
        },
      },
    });
    if (!user || !user.profileExtension?.isPublic) throw new NotFoundException("Profile not found");

    const [completedLabs] = await Promise.all([
      this.prisma.userLabProgress.count({ where: { userId: user.id, isCompleted: true } }),
    ]);

    const isFollowing = viewerId
      ? !!(await this.prisma.userFollow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: user.id } } }))
      : false;

    const writeups = await this.prisma.writeup.findMany({
      where: { authorId: user.id, visibility: "PUBLIC", isDraft: false, deletedAt: null },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, category: true, viewCount: true, likeCount: true, publishedAt: true },
    });

    return {
      ...user,
      labsCompleted: completedLabs,
      reputation: user.profileExtension?.reputation ?? 0,
      tier: this.reputation.getTier(user.profileExtension?.reputation ?? 0),
      isFollowing,
      recentWriteups: writeups,
    };
  }

  async updateProfile(userId: string, dto: {
    skills?: string[]; interests?: string[];
    githubUrl?: string; twitterUrl?: string; linkedinUrl?: string; websiteUrl?: string;
    isPublic?: boolean; showActivity?: boolean; showAchievements?: boolean;
  }) {
    return this.prisma.userProfileExtension.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  // ── Follow System ────────────────────────────────────────────
  async follow(followerId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername }, select: { id: true } });
    if (!target) throw new NotFoundException("User not found");
    if (target.id === followerId) throw new ForbiddenException("Cannot follow yourself");

    try {
      await this.prisma.userFollow.create({ data: { followerId, followingId: target.id } });
    } catch {
      throw new ConflictException("Already following");
    }

    await this.addActivity(followerId, target.id, "followed");
    return { following: true };
  }

  async unfollow(followerId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername }, select: { id: true } });
    if (!target) throw new NotFoundException("User not found");

    await this.prisma.userFollow.deleteMany({ where: { followerId, followingId: target.id } });
    return { following: false };
  }

  async getFollowers(username: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) throw new NotFoundException();
    const [items, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followingId: user.id },
        include: { follower: { select: { id: true, username: true, avatarUrl: true, bio: true, score: { select: { level: true, totalXp: true } } } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.userFollow.count({ where: { followingId: user.id } }),
    ]);
    return { items: items.map(f => f.follower), total, page, limit };
  }

  async getFollowing(username: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) throw new NotFoundException();
    const [items, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followerId: user.id },
        include: { following: { select: { id: true, username: true, avatarUrl: true, bio: true, score: { select: { level: true, totalXp: true } } } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.userFollow.count({ where: { followerId: user.id } }),
    ]);
    return { items: items.map(f => f.following), total, page, limit };
  }

  // ── Bookmarks ────────────────────────────────────────────────
  async toggleBookmark(userId: string, resourceType: string, resourceId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_resourceType_resourceId: { userId, resourceType, resourceId } },
    });
    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }
    await this.prisma.bookmark.create({ data: { userId, resourceType, resourceId } });
    return { bookmarked: true };
  }

  async getBookmarks(userId: string, resourceType?: string, page = 1, limit = 20) {
    const where: Prisma.BookmarkWhereInput = { userId, ...(resourceType ? { resourceType } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.bookmark.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.bookmark.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  // ── Activity Feed ────────────────────────────────────────────
  async addActivity(actorId: string, userId: string, type: string, resourceType?: string, resourceId?: string, metadata?: Record<string, unknown>) {
    await this.prisma.activityFeed.create({
      data: { userId, actorId, type, resourceType, resourceId, metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined },
    });
  }

  async getFeed(userId: string, page = 1, limit = 20) {
    // Feed = activities of people the user follows + their own
    const following = await this.prisma.userFollow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    const actorIds = [userId, ...following.map(f => f.followingId)];

    const [items, total] = await Promise.all([
      this.prisma.activityFeed.findMany({
        where: { actorId: { in: actorIds } },
        include: {
          actor: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityFeed.count({ where: { actorId: { in: actorIds } } }),
    ]);
    return { items, total, page, limit };
  }

  // ── Search ───────────────────────────────────────────────────
  async search(query: string, type?: "users" | "writeups" | "discussions") {
    const q = query.trim().toLowerCase();
    const results: Record<string, unknown[]> = {};

    if (!type || type === "users") {
      results.users = await this.prisma.user.findMany({
        where: { username: { contains: q, mode: "insensitive" }, isActive: true, isBanned: false },
        select: { id: true, username: true, avatarUrl: true, bio: true, score: { select: { level: true, totalXp: true } } },
        take: 10,
      });
    }
    if (!type || type === "writeups") {
      results.writeups = await this.prisma.writeup.findMany({
        where: {
          OR: [{ title: { contains: q, mode: "insensitive" } }, { tags: { has: q } }],
          visibility: "PUBLIC", isDraft: false, deletedAt: null,
        },
        select: { id: true, title: true, slug: true, category: true, author: { select: { username: true } } },
        take: 10,
      });
    }
    if (!type || type === "discussions") {
      results.discussions = await this.prisma.discussion.findMany({
        where: {
          OR: [{ title: { contains: q, mode: "insensitive" } }, { tags: { has: q } }],
          deletedAt: null,
        },
        select: { id: true, title: true, category: true, voteScore: true, replyCount: true, author: { select: { username: true } } },
        take: 10,
      });
    }
    return results;
  }
}
