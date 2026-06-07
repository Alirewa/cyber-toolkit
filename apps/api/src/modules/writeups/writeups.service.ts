import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { WriteupVisibility } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ReputationService } from "../reputation/reputation.service";
import { CommunityService } from "../community/community.service";
import type { CreateWriteupDto, CreateNoteDto } from "./dto/create-writeup.dto";

function generateSlug(title: string, id: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + id.slice(0, 6);
}

const AUTHOR_SELECT = { id: true, username: true, avatarUrl: true, score: { select: { level: true } } };

@Injectable()
export class WriteupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationService,
    private readonly community: CommunityService,
  ) {}

  // ── Writeups ──────────────────────────────────────────────────
  async create(authorId: string, dto: CreateWriteupDto) {
    const tempSlug = generateSlug(dto.title, Date.now().toString(36));
    const publishedAt = dto.isDraft ? null : new Date();

    const writeup = await this.prisma.writeup.create({
      data: {
        authorId,
        title: dto.title,
        slug: tempSlug,
        body: dto.body,
        summary: dto.summary,
        category: dto.category ?? "GENERAL",
        tags: dto.tags ?? [],
        visibility: dto.visibility ?? "PUBLIC",
        labId: dto.labId,
        isDraft: dto.isDraft ?? false,
        publishedAt,
      },
      include: { author: { select: AUTHOR_SELECT } },
    });

    if (!dto.isDraft) {
      await this.reputation.award(authorId, "WRITEUP_PUBLISHED", { writeupId: writeup.id });
      await this.community.addActivity(authorId, authorId, "writeup_published", "writeup", writeup.id);
    }
    return writeup;
  }

  async findAll(page = 1, limit = 20, opts?: { category?: string; tag?: string; authorId?: string; search?: string }) {
    const where = {
      visibility: WriteupVisibility.PUBLIC,
      isDraft: false,
      deletedAt: null as null,
      ...(opts?.category ? { category: opts.category as never } : {}),
      ...(opts?.tag ? { tags: { has: opts.tag } } : {}),
      ...(opts?.authorId ? { authorId: opts.authorId } : {}),
      ...(opts?.search ? { OR: [
        { title: { contains: opts.search, mode: "insensitive" as const } },
        { tags: { has: opts.search } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.writeup.findMany({
        where,
        include: { author: { select: AUTHOR_SELECT } },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.writeup.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findBySlug(slug: string, userId?: string) {
    const writeup = await this.prisma.writeup.findFirst({
      where: { slug, deletedAt: null },
      include: { author: { select: AUTHOR_SELECT }, lab: { select: { id: true, slug: true, name: true } } },
    });
    if (!writeup) throw new NotFoundException("Writeup not found");

    const canView =
      writeup.visibility === "PUBLIC" ||
      writeup.authorId === userId ||
      (writeup.visibility === "UNLISTED" && userId);

    if (!canView) throw new ForbiddenException("This writeup is private");

    await this.prisma.writeup.update({ where: { id: writeup.id }, data: { viewCount: { increment: 1 } } });

    const bookmarked = userId
      ? !!(await this.prisma.bookmark.findUnique({ where: { userId_resourceType_resourceId: { userId, resourceType: "writeup", resourceId: writeup.id } } }))
      : false;

    return { ...writeup, bookmarked };
  }

  async update(id: string, userId: string, dto: Partial<CreateWriteupDto>) {
    const writeup = await this.prisma.writeup.findUnique({ where: { id }, select: { authorId: true, isDraft: true } });
    if (!writeup) throw new NotFoundException();
    if (writeup.authorId !== userId) throw new ForbiddenException();

    const wasPublished = !writeup.isDraft;
    const nowPublishing = dto.isDraft === false && writeup.isDraft;

    const updated = await this.prisma.writeup.update({
      where: { id },
      data: {
        ...dto,
        ...(nowPublishing ? { publishedAt: new Date() } : {}),
      } as never,
    });

    if (nowPublishing && !wasPublished) {
      await this.reputation.award(userId, "WRITEUP_PUBLISHED", { writeupId: id });
    }
    return updated;
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const w = await this.prisma.writeup.findUnique({ where: { id }, select: { authorId: true } });
    if (!w) throw new NotFoundException();
    if (!isAdmin && w.authorId !== userId) throw new ForbiddenException();
    await this.prisma.writeup.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getMyWriteups(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.writeup.findMany({
        where: { authorId: userId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.writeup.count({ where: { authorId: userId, deletedAt: null } }),
    ]);
    return { items, total, page, limit };
  }

  // ── Notes (private) ───────────────────────────────────────────
  async createNote(userId: string, dto: CreateNoteDto) {
    return this.prisma.note.create({ data: { userId, ...dto } });
  }

  async getMyNotes(userId: string, labId?: string) {
    return this.prisma.note.findMany({
      where: { userId, ...(labId ? { labId } : {}) },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });
  }

  async updateNote(id: string, userId: string, dto: Partial<CreateNoteDto>) {
    const note = await this.prisma.note.findUnique({ where: { id }, select: { userId: true } });
    if (!note || note.userId !== userId) throw new ForbiddenException();
    return this.prisma.note.update({ where: { id }, data: dto });
  }

  async deleteNote(id: string, userId: string) {
    const note = await this.prisma.note.findUnique({ where: { id }, select: { userId: true } });
    if (!note || note.userId !== userId) throw new ForbiddenException();
    await this.prisma.note.delete({ where: { id } });
  }
}
