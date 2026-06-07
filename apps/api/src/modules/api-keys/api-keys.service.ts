import { Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../database/prisma.service";
import type { CreateApiKeyDto } from "./dto/create-api-key.dto";

const KEY_PREFIX = "clk_";

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateApiKeyDto) {
    // Generate a secure random key — shown ONCE only
    const rawKey = `${KEY_PREFIX}${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name,
        keyHash,
        expiresAt: dto.expiresAt,
      },
    });

    return {
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey,       // plaintext shown ONCE
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
      },
      message: "API key created. Copy it now — it will not be shown again.",
    };
  }

  async findAll(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      select: { id: true, name: true, lastUsedAt: true, expiresAt: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return { data: keys, message: "API keys retrieved" };
  }

  async revoke(userId: string, id: string): Promise<void> {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundException("API key not found");
    await this.prisma.apiKey.update({ where: { id }, data: { isActive: false } });
  }

  async validateKey(rawKey: string) {
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!apiKey || !apiKey.isActive) return null;
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return null;

    // Update last used
    await this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });

    return apiKey.user;
  }
}
