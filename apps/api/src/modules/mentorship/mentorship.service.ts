import { Injectable, NotFoundException, ForbiddenException, ConflictException } from "@nestjs/common";
import { MentorshipStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ReputationService } from "../reputation/reputation.service";

@Injectable()
export class MentorshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationService,
  ) {}

  // ── Mentor Profile ─────────────────────────────────────────────
  async becomeMentor(userId: string, dto: { bio?: string; expertise?: string[]; maxStudents?: number }) {
    return this.prisma.mentorProfile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  async listMentors(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.mentorProfile.findMany({
        where: { isActive: true },
        include: { user: { select: { id: true, username: true, avatarUrl: true, bio: true, score: { select: { level: true, totalXp: true } } } } },
        orderBy: [{ rating: "desc" }, { totalSessions: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mentorProfile.count({ where: { isActive: true } }),
    ]);
    return { items, total, page, limit };
  }

  async getMentorProfile(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) throw new NotFoundException();
    const profile = await this.prisma.mentorProfile.findUnique({
      where: { userId: user.id },
      include: { user: { select: { id: true, username: true, avatarUrl: true, bio: true, score: { select: { level: true, totalXp: true } } } } },
    });
    if (!profile || !profile.isActive) throw new NotFoundException("Mentor profile not found");
    return profile;
  }

  // ── Requests ──────────────────────────────────────────────────
  async requestMentorship(studentId: string, mentorUsername: string, dto: { message?: string; goals?: string[] }) {
    const mentor = await this.prisma.user.findUnique({ where: { username: mentorUsername }, select: { id: true } });
    if (!mentor) throw new NotFoundException();
    if (mentor.id === studentId) throw new ForbiddenException("Cannot mentor yourself");

    const mentorProfile = await this.prisma.mentorProfile.findUnique({ where: { userId: mentor.id } });
    if (!mentorProfile || !mentorProfile.isActive) throw new NotFoundException("Not a mentor");

    const existing = await this.prisma.mentorshipRequest.findFirst({
      where: { studentId, mentorId: mentor.id, status: MentorshipStatus.PENDING },
    });
    if (existing) throw new ConflictException("Request already pending");

    return this.prisma.mentorshipRequest.create({
      data: { mentorId: mentor.id, studentId, message: dto.message, goals: dto.goals ?? [] },
    });
  }

  async respondToRequest(requestId: string, mentorId: string, accept: boolean) {
    const req = await this.prisma.mentorshipRequest.findUnique({ where: { id: requestId } });
    if (!req || req.mentorId !== mentorId) throw new NotFoundException();
    if (req.status !== MentorshipStatus.PENDING) throw new ForbiddenException("Already responded");

    const status = accept ? MentorshipStatus.ACTIVE : MentorshipStatus.CANCELLED;
    const updated = await this.prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status, resolvedAt: new Date() },
    });

    if (accept) {
      await this.prisma.mentorProfile.update({ where: { userId: mentorId }, data: { totalSessions: { increment: 1 } } });
      await this.reputation.award(mentorId, "MENTORSHIP_GIVEN", { requestId });
    }

    return updated;
  }

  async getMyRequests(userId: string, role: "mentor" | "student") {
    const where = role === "mentor" ? { mentorId: userId } : { studentId: userId };
    return this.prisma.mentorshipRequest.findMany({
      where,
      include: {
        mentor: { select: { id: true, username: true, avatarUrl: true } },
        student: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
