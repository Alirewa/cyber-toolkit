import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { ConfigService } from "../config/config.service";
import { UsersService } from "../users/users.service";
import { RolesService } from "../roles/roles.service";
import { PrismaService } from "../database/prisma.service";
import { RedisService } from "../redis/redis.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { QueueService } from "../queue/queue.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { JwtPayload } from "@cyberlab/types";
import { Role } from "@cyberlab/types";
import type { User } from "@prisma/client";

const REFRESH_TOKEN_BLOCKLIST_PREFIX = "blocklist:refresh:";
const BRUTE_FORCE_PREFIX = "bruteforce:";
const MAX_LOGIN_ATTEMPTS = 5;
const BRUTE_FORCE_TTL = 900; // 15 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly auditLogs: AuditLogsService,
    private readonly queueService: QueueService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string) {
    const user = await this.usersService.create(dto);
    await this.rolesService.assignRole(user.id, Role.USER);

    // Generate email verification token
    const verifyToken = this.generateSecureToken();
    const tokenHash = this.hashToken(verifyToken);
    await this.redis.setex(
      `verify:email:${tokenHash}`,
      86400, // 24 hours
      user.id
    );

    // Queue email (dev: logs to console)
    await this.queueService.addEmailJob("send-verification", {
      to: user.email,
      username: user.username,
      token: verifyToken,
    });

    await this.auditLogs.log({
      userId: user.id,
      action: "user.register",
      resource: "users",
      resourceId: user.id,
      ipAddress,
    });

    return { data: { message: "Registration successful. Check your email to verify your account." }, message: "Registration successful" };
  }

  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    // Brute-force check
    const bruteKey = `${BRUTE_FORCE_PREFIX}${ipAddress}:${dto.email}`;
    const attempts = await this.redis.get(bruteKey);
    if (attempts && parseInt(attempts) >= MAX_LOGIN_ATTEMPTS) {
      const ttl = await this.redis.ttl(bruteKey);
      throw new UnauthorizedException(
        `Too many failed attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`
      );
    }

    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !(await this.usersService.verifyPassword(user, dto.password))) {
      // Increment brute force counter
      const count = await this.redis.incr(bruteKey);
      if (count === 1) await this.redis.expire(bruteKey, BRUTE_FORCE_TTL);
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.isBanned) throw new UnauthorizedException("Your account has been banned");
    if (!user.isActive) throw new UnauthorizedException("Your account is inactive");

    // Clear brute force counter on success
    await this.redis.del(bruteKey);

    const roles = await this.rolesService.getUserRoles(user.id);
    const { accessToken, refreshToken, sessionId } = await this.createTokens(user, roles, ipAddress, userAgent);

    await this.usersService.updateLastLogin(user.id);
    await this.auditLogs.log({
      userId: user.id,
      action: "user.login",
      resource: "users",
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return { accessToken, refreshToken, user, sessionId };
  }

  async refresh(refreshToken: string, ipAddress: string) {
    // Check blocklist
    const tokenHash = this.hashToken(refreshToken);
    const isBlocked = await this.redis.exists(`${REFRESH_TOKEN_BLOCKLIST_PREFIX}${tokenHash}`);
    if (isBlocked) throw new UnauthorizedException("Refresh token has been revoked");

    // Find session by token hash
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: tokenHash },
      include: { user: true },
    });

    if (!session) throw new UnauthorizedException("Invalid refresh token");
    if (new Date() > session.expiresAt) throw new UnauthorizedException("Refresh token expired");
    if (!session.user.isActive || session.user.isBanned) {
      throw new UnauthorizedException("Account is inactive");
    }

    // Verify JWT refresh token
    try {
      this.jwtService.verify(refreshToken, { secret: this.config.jwtRefreshSecret });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Rotate: invalidate old, issue new
    await this.redis.setex(`${REFRESH_TOKEN_BLOCKLIST_PREFIX}${tokenHash}`, 7 * 86400, "1");

    const roles = await this.rolesService.getUserRoles(session.userId);
    const newRefreshToken = this.jwtService.sign(
      { sub: session.userId, email: session.user.email, roles, sessionId: session.id },
      { secret: this.config.jwtRefreshSecret, expiresIn: this.config.jwtRefreshExpiry }
    );
    const newRefreshHash = this.hashToken(newRefreshToken);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshHash,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = this.jwtService.sign(
      { sub: session.userId, email: session.user.email, roles, sessionId: session.id },
      { secret: this.config.jwtAccessSecret, expiresIn: this.config.jwtAccessExpiry }
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, sessionId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    // Add to blocklist
    await this.redis.setex(`${REFRESH_TOKEN_BLOCKLIST_PREFIX}${tokenHash}`, 7 * 86400, "1");

    // Delete session
    await this.prisma.session.deleteMany({ where: { id: sessionId, userId } });

    await this.auditLogs.log({ userId, action: "user.logout", resource: "sessions", resourceId: sessionId });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Don't leak whether email exists

    const resetToken = this.generateSecureToken();
    const tokenHash = this.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await this.prisma.passwordReset.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    await this.queueService.addEmailJob("send-password-reset", {
      to: user.email,
      username: user.username,
      token: resetToken,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const reset = await this.prisma.passwordReset.findUnique({ where: { tokenHash } });

    if (!reset || reset.usedAt || new Date() > reset.expiresAt) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    await this.usersService.updatePassword(reset.userId, newPassword);
    await this.prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });

    // Invalidate all sessions
    await this.prisma.session.deleteMany({ where: { userId: reset.userId } });
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const userId = await this.redis.get(`verify:email:${tokenHash}`);
    if (!userId) throw new BadRequestException("Invalid or expired verification token");

    await this.usersService.markEmailVerified(userId);
    await this.redis.del(`verify:email:${tokenHash}`);
  }

  async getMe(userId: string) {
    const user = await this.usersService.getUserWithRoles(userId);
    return { data: user, message: "Profile retrieved" };
  }

  async getSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true, ipAddress: true, userAgent: true, lastUsedAt: true, createdAt: true, expiresAt: true },
      orderBy: { lastUsedAt: "desc" },
    });
    return { data: sessions, message: "Sessions retrieved" };
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: sessionId, userId } });
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId, NOT: { id: currentSessionId } },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByIdOrThrow(userId);
    const valid = await this.usersService.verifyPassword(user, currentPassword);
    if (!valid) throw new UnauthorizedException("Current password is incorrect");
    await this.usersService.updatePassword(userId, newPassword);
  }

  private async createTokens(
    user: User,
    roles: Role[],
    ipAddress: string,
    userAgent: string
  ) {
    const sessionId = crypto.randomUUID();

    const payload: JwtPayload = { sub: user.id, email: user.email, roles, sessionId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.jwtAccessSecret,
      expiresIn: this.config.jwtAccessExpiry,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: this.config.jwtRefreshExpiry,
    });

    const refreshHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: { id: sessionId, userId: user.id, refreshToken: refreshHash, ipAddress, userAgent, expiresAt },
    });

    return { accessToken, refreshToken, sessionId };
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
