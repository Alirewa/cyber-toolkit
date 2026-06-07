import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import Docker from "dockerode";
import { randomUUID } from "crypto";
import { ConfigService } from "../../config/config.service";
import { LabRegistryService } from "../lab-registry.service";
import type { ISandboxProvider, SandboxStartResult } from "./sandbox.interface";

/**
 * DockerSandboxProvider — spawns one isolated container per lab session.
 *
 * Hardening applied to every container:
 *   - Memory + CPU + PID limits
 *   - `cap-drop=ALL` and `no-new-privileges`
 *   - Read-only root filesystem with a small tmpfs for /tmp
 *   - Attached to a dedicated bridge network whose IP-masquerade is disabled,
 *     so published ports still reach the container (ingress) but the container
 *     cannot initiate outbound connections to the internet (egress blocked).
 *   - Labelled `cyberlab.lab=true` for sweep-based cleanup.
 *
 * Each lab image is expected to listen on container port 80.
 */
@Injectable()
export class DockerSandboxProvider implements ISandboxProvider {
  private readonly logger = new Logger(DockerSandboxProvider.name);
  private docker: Docker | null = null;
  private networkEnsured = false;
  private readonly CONTAINER_PORT = "80/tcp";
  /** Host ports currently handed out (best-effort, augmented by retry). */
  private readonly usedPorts = new Set<number>();

  constructor(
    private readonly config: ConfigService,
    private readonly registry: LabRegistryService,
  ) {}

  private client(): Docker {
    if (!this.docker) {
      this.docker = new Docker({ socketPath: this.config.dockerSocketPath });
    }
    return this.docker;
  }

  /** Create the isolated sandbox network once per process if it doesn't exist. */
  private async ensureNetwork(): Promise<void> {
    if (this.networkEnsured) return;
    const name = this.config.sandboxNetwork;
    const docker = this.client();
    const existing = await docker.listNetworks({ filters: { name: [name] } });
    if (existing.length === 0) {
      await docker.createNetwork({
        Name: name,
        Driver: "bridge",
        Internal: false,
        CheckDuplicate: true,
        Options: {
          // Disable outbound NAT → containers can't reach the internet,
          // but host->container published ports (DNAT) keep working.
          "com.docker.network.bridge.enable_ip_masquerade": "false",
        },
        Labels: { "cyberlab.network": "true" },
      });
      this.logger.log(`Created sandbox network '${name}'`);
    }
    this.networkEnsured = true;
  }

  private allocatePort(): number {
    const start = this.config.sandboxPortRangeStart;
    const end = this.config.sandboxPortRangeEnd;
    for (let attempt = 0; attempt < 200; attempt++) {
      const port = start + Math.floor(Math.random() * (end - start + 1));
      if (!this.usedPorts.has(port)) {
        this.usedPorts.add(port);
        return port;
      }
    }
    throw new ServiceUnavailableException("No free sandbox ports available");
  }

  async start(labSlug: string, userId: string): Promise<SandboxStartResult> {
    const lab = this.registry.getBySlug(labSlug);
    const image = lab.meta.sandboxImage;
    if (!image) {
      throw new ServiceUnavailableException(`Lab '${labSlug}' has no sandboxImage configured`);
    }

    await this.ensureNetwork();
    const docker = this.client();

    // Up to 3 attempts to dodge a port collision race.
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const hostPort = this.allocatePort();
      const name = `cyberlab-${labSlug}-${randomUUID().slice(0, 8)}`;
      try {
        const container = await docker.createContainer({
          Image: image,
          name,
          Labels: {
            "cyberlab.lab": "true",
            "cyberlab.userId": userId,
            "cyberlab.labSlug": labSlug,
          },
          ExposedPorts: { [this.CONTAINER_PORT]: {} },
          HostConfig: {
            Memory: this.config.sandboxMemoryMb * 1024 * 1024,
            MemorySwap: this.config.sandboxMemoryMb * 1024 * 1024, // disable swap
            NanoCpus: Math.round(this.config.sandboxCpus * 1e9),
            PidsLimit: 128,
            PortBindings: {
              [this.CONTAINER_PORT]: [{ HostPort: String(hostPort) }],
            },
            NetworkMode: this.config.sandboxNetwork,
            RestartPolicy: { Name: "no" },
            CapDrop: ["ALL"],
            SecurityOpt: ["no-new-privileges"],
            ReadonlyRootfs: true,
            Tmpfs: { "/tmp": "rw,noexec,nosuid,size=32m" },
            AutoRemove: false,
          },
        });

        await container.start();
        const url = `${this.config.sandboxScheme}://${this.config.sandboxHost}:${hostPort}`;
        const expiresAt = new Date(Date.now() + this.config.sandboxTtlMinutes * 60 * 1000);

        this.logger.log(`Started sandbox ${name} (${labSlug}, user ${userId}) → ${url}`);
        return { url, containerId: container.id, expiresAt, provider: "docker" };
      } catch (err: unknown) {
        this.usedPorts.delete(hostPort);
        lastErr = err;
        this.logger.warn(`Sandbox start attempt ${attempt + 1} failed: ${String(err)}`);
      }
    }

    throw new ServiceUnavailableException(
      `Failed to start sandbox for '${labSlug}': ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
    );
  }

  async reset(sandboxId: string, labSlug: string, userId: string): Promise<{ url: string }> {
    await this.stop(sandboxId);
    const result = await this.start(labSlug, userId);
    return { url: result.url };
  }

  async stop(sandboxId: string): Promise<void> {
    try {
      const container = this.client().getContainer(sandboxId);
      // Free the host port we had bound.
      try {
        const info = await container.inspect();
        const bindings = info.NetworkSettings?.Ports?.[this.CONTAINER_PORT];
        const hostPort = bindings?.[0]?.HostPort;
        if (hostPort) this.usedPorts.delete(Number(hostPort));
      } catch {
        /* inspect best-effort */
      }
      await container.remove({ force: true });
      this.logger.log(`Removed sandbox container ${sandboxId}`);
    } catch (err: unknown) {
      // 404 → already gone; anything else is logged but non-fatal for cleanup.
      const status = (err as { statusCode?: number })?.statusCode;
      if (status !== 404) {
        this.logger.warn(`Failed to remove container ${sandboxId}: ${String(err)}`);
      }
    }
  }

  async isRunning(sandboxId: string): Promise<boolean> {
    try {
      const info = await this.client().getContainer(sandboxId).inspect();
      return Boolean(info.State?.Running);
    } catch {
      return false;
    }
  }
}
