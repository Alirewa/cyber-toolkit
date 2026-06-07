import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { ReputationService } from "../reputation/reputation.service";
import { CommunityService } from "../community/community.service";
import type { CreateDiscussionDto, CreateReplyDto } from "./dto/create-discussion.dto";

const AUTHOR_SELECT = { id: true, username: true, avatarUrl: true, score: { select: { level: true } } };

@Injectable()
export class DiscussionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationService,
    private readonly community: CommunityService,
  ) {}

  // ── Discussions ───────────────────────────────────────────────
  async create(authorId: string, dto: CreateDiscussionDto) {
    const disc = await this.prisma.discussion.create({
      data: {
        authorId, title: dto.title, body: dto.body,
        labId: dto.labId, category: dto.category ?? "general",
        tags: dto.tags ?? [],
      },
      include: { author: { select: AUTHOR_SELECT } },
    });

    await this.reputation.award(authorId, "DISCUSSION_CREATED", { discussionId: disc.id });
    await this.community.addActivity(authorId, authorId, "discussion_created", "discussion", disc.id);
    return disc;
  }

  async findAll(page = 1, limit = 20, opts?: { category?: string; labId?: string; sort?: "hot" | "new" | "top"; search?: string }) {
    const where = {
      deletedAt: null as null,
      ...(opts?.category ? { category: opts.category } : {}),
      ...(opts?.labId ? { labId: opts.labId } : {}),
      ...(opts?.search ? { title: { contains: opts.search, mode: "insensitive" as const } } : {}),
    };
    const orderBy =
      opts?.sort === "hot"  ? { replyCount: "desc" as const } :
      opts?.sort === "top"  ? { voteScore: "desc" as const }  :
                              { createdAt:  "desc" as const };

    const [items, total] = await Promise.all([
      this.prisma.discussion.findMany({
        where,
        include: { author: { select: AUTHOR_SELECT }, _count: { select: { replies: true } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.discussion.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string, userId?: string) {
    const disc = await this.prisma.discussion.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: AUTHOR_SELECT },
        lab: { select: { id: true, slug: true, name: true } },
        replies: {
          where: { deletedAt: null, parentId: null },
          include: {
            author: { select: AUTHOR_SELECT },
            children: {
              where: { deletedAt: null },
              include: { author: { select: AUTHOR_SELECT } },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: [{ isAccepted: "desc" }, { voteScore: "desc" }, { createdAt: "asc" }],
        },
        _count: { select: { replies: true } },
      },
    });
    if (!disc) throw new NotFoundException("Discussion not found");

    // Increment view count
    await this.prisma.discussion.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    const myVote = userId
      ? await this.prisma.discussionVote.findUnique({ where: { userId_discussionId: { userId, discussionId: id } } })
      : null;

    return { ...disc, myVote: myVote?.value ?? 0 };
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const disc = await this.prisma.discussion.findUnique({ where: { id }, select: { authorId: true } });
    if (!disc) throw new NotFoundException();
    if (!isAdmin && disc.authorId !== userId) throw new ForbiddenException();
    await this.prisma.discussion.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Replies ───────────────────────────────────────────────────
  async createReply(discussionId: string, authorId: string, dto: CreateReplyDto) {
    const disc = await this.prisma.discussion.findFirst({ where: { id: discussionId, deletedAt: null } });
    if (!disc) throw new NotFoundException("Discussion not found");
    if (disc.status === "CLOSED") throw new ForbiddenException("Discussion is closed");

    const [reply] = await this.prisma.$transaction([
      this.prisma.discussionReply.create({
        data: { discussionId, authorId, body: dto.body, parentId: dto.parentId },
        include: { author: { select: AUTHOR_SELECT } },
      }),
      this.prisma.discussion.update({ where: { id: discussionId }, data: { replyCount: { increment: 1 } } }),
    ]);

    await this.reputation.award(authorId, "DISCUSSION_CREATED", { replyDiscussionId: discussionId });
    return reply;
  }

  async deleteReply(replyId: string, userId: string, isAdmin = false) {
    const reply = await this.prisma.discussionReply.findUnique({ where: { id: replyId }, select: { authorId: true, discussionId: true } });
    if (!reply) throw new NotFoundException();
    if (!isAdmin && reply.authorId !== userId) throw new ForbiddenException();
    await this.prisma.$transaction([
      this.prisma.discussionReply.update({ where: { id: replyId }, data: { deletedAt: new Date() } }),
      this.prisma.discussion.update({ where: { id: reply.discussionId }, data: { replyCount: { decrement: 1 } } }),
    ]);
  }

  async markAccepted(discussionId: string, replyId: string, userId: string) {
    const disc = await this.prisma.discussion.findUnique({ where: { id: discussionId }, select: { authorId: true } });
    if (!disc || disc.authorId !== userId) throw new ForbiddenException();
    // Clear previous accepted, set new
    await this.prisma.$transaction([
      this.prisma.discussionReply.updateMany({ where: { discussionId, isAccepted: true }, data: { isAccepted: false } }),
      this.prisma.discussionReply.update({ where: { id: replyId }, data: { isAccepted: true } }),
    ]);
    // Award rep to reply author
    const reply = await this.prisma.discussionReply.findUnique({ where: { id: replyId }, select: { authorId: true } });
    if (reply) await this.reputation.award(reply.authorId, "REPLY_HELPFUL", { discussionId });
    return { accepted: true };
  }

  // ── Voting ────────────────────────────────────────────────────
  async vote(userId: string, discussionId: string | null, replyId: string | null, value: 1 | -1) {
    if (!discussionId && !replyId) throw new ForbiddenException();

    if (discussionId) {
      const existing = await this.prisma.discussionVote.findUnique({ where: { userId_discussionId: { userId, discussionId } } });
      if (existing) {
        if (existing.value === value) {
          // Remove vote
          await this.prisma.$transaction([
            this.prisma.discussionVote.delete({ where: { id: existing.id } }),
            this.prisma.discussion.update({ where: { id: discussionId }, data: { voteScore: { decrement: value } } }),
          ]);
          return { score: 0 };
        }
        // Flip vote
        await this.prisma.$transaction([
          this.prisma.discussionVote.update({ where: { id: existing.id }, data: { value } }),
          this.prisma.discussion.update({ where: { id: discussionId }, data: { voteScore: { increment: value * 2 } } }),
        ]);
      } else {
        await this.prisma.$transaction([
          this.prisma.discussionVote.create({ data: { userId, discussionId, value } }),
          this.prisma.discussion.update({ where: { id: discussionId }, data: { voteScore: { increment: value } } }),
        ]);
      }
      const d = await this.prisma.discussion.findUnique({ where: { id: discussionId }, select: { voteScore: true } });
      return { score: d?.voteScore ?? 0 };
    }

    if (replyId) {
      const existing = await this.prisma.discussionVote.findUnique({ where: { userId_replyId: { userId, replyId } } });
      if (existing) {
        if (existing.value === value) {
          await this.prisma.$transaction([
            this.prisma.discussionVote.delete({ where: { id: existing.id } }),
            this.prisma.discussionReply.update({ where: { id: replyId }, data: { voteScore: { decrement: value } } }),
          ]);
          return { score: 0 };
        }
        await this.prisma.$transaction([
          this.prisma.discussionVote.update({ where: { id: existing.id }, data: { value } }),
          this.prisma.discussionReply.update({ where: { id: replyId }, data: { voteScore: { increment: value * 2 } } }),
        ]);
      } else {
        await this.prisma.$transaction([
          this.prisma.discussionVote.create({ data: { userId, replyId, value } }),
          this.prisma.discussionReply.update({ where: { id: replyId }, data: { voteScore: { increment: value } } }),
        ]);
        if (value > 0) {
          const r = await this.prisma.discussionReply.findUnique({ where: { id: replyId }, select: { authorId: true } });
          if (r) await this.reputation.award(r.authorId, "REPLY_HELPFUL", { replyId });
        }
      }
      const r = await this.prisma.discussionReply.findUnique({ where: { id: replyId }, select: { voteScore: true } });
      return { score: r?.voteScore ?? 0 };
    }

    return { score: 0 };
  }
}
