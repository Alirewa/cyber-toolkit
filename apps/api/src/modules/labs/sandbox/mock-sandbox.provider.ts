import { Injectable, Logger } from "@nestjs/common";
import type { ISandboxProvider, SandboxStartResult } from "./sandbox.interface";
import { randomUUID } from "crypto";

/**
 * MockSandboxProvider — Development mode sandbox simulation.
 *
 * Returns a fake URL pointing to the API's built-in mock lab environment
 * endpoint (/api/labs/sandbox/:labSlug). In production, swap this with
 * DockerSandboxProvider that spawns real isolated containers.
 */
@Injectable()
export class MockSandboxProvider implements ISandboxProvider {
  private readonly logger = new Logger(MockSandboxProvider.name);
  private readonly activeContainers = new Map<string, { labSlug: string; userId: string; url: string }>();

  async start(labSlug: string, userId: string): Promise<SandboxStartResult> {
    const containerId = `mock-${randomUUID().slice(0, 8)}`;
    const url = `/api/labs/sandbox/${labSlug}?session=${containerId}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    this.activeContainers.set(containerId, { labSlug, userId, url });
    this.logger.log(`[MOCK] Started sandbox for ${labSlug} (user: ${userId}) → ${containerId}`);

    return { url, containerId, expiresAt, provider: "mock" };
  }

  async reset(sandboxId: string, labSlug: string, userId: string): Promise<{ url: string }> {
    this.logger.log(`[MOCK] Resetting sandbox ${sandboxId} for ${labSlug}`);
    const url = `/api/labs/sandbox/${labSlug}?session=${sandboxId}&reset=1`;
    this.activeContainers.set(sandboxId, { labSlug, userId, url });
    return { url };
  }

  async stop(sandboxId: string): Promise<void> {
    this.logger.log(`[MOCK] Stopping sandbox ${sandboxId}`);
    this.activeContainers.delete(sandboxId);
  }

  async isRunning(sandboxId: string): Promise<boolean> {
    return this.activeContainers.has(sandboxId);
  }
}
