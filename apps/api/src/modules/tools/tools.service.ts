import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { ToolRegistryService } from "./tool-registry.service";

/** Shape returned to the frontend — matches ToolDefinition DB model */
function handlerToDefinition(h: ReturnType<ToolRegistryService["getAllHandlers"]>[number]) {
  return {
    id: h.metadata.slug,
    slug: h.metadata.slug,
    name: h.metadata.name,
    description: h.metadata.description,
    category: h.metadata.category,
    icon: h.metadata.icon,
    isEnabled: true,
    isNetwork: h.metadata.isNetwork,
    isInstant: h.metadata.isInstant,
    inputSchema: { fields: h.metadata.inputFields } as Record<string, unknown>,
    examples: h.metadata.examples,
    safetyNote: h.metadata.safetyNote ?? null,
    version: "1.0.0",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };
}

@Injectable()
export class ToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ToolRegistryService,
  ) {}

  /** Always reads from the in-memory handler registry — no DB query needed. */
  findAll() {
    const handlers = this.registry.getAllHandlers();
    const data = handlers
      .map(handlerToDefinition)
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return { data, message: "Tools retrieved" };
  }

  findBySlug(slug: string) {
    const handler = this.registry.hasHandler(slug)
      ? this.registry.getHandler(slug)
      : null;
    if (!handler) throw new NotFoundException(`Tool '${slug}' not found`);
    return { data: handlerToDefinition(handler), message: "Tool retrieved" };
  }

  // Saved Targets
  async getSavedTargets(userId: string) {
    const targets = await this.prisma.userSavedTarget.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return { data: targets, message: "Saved targets retrieved" };
  }

  async saveTarget(userId: string, dto: { label: string; target: string; notes?: string }) {
    const target = await this.prisma.userSavedTarget.create({
      data: { userId, ...dto },
    });
    return { data: target, message: "Target saved" };
  }

  async deleteSavedTarget(userId: string, id: string): Promise<void> {
    const target = await this.prisma.userSavedTarget.findFirst({ where: { id, userId } });
    if (!target) throw new NotFoundException("Saved target not found");
    await this.prisma.userSavedTarget.delete({ where: { id } });
  }
}
