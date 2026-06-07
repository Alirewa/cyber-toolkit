export interface SandboxStartResult {
  url: string;
  containerId?: string;
  expiresAt: Date;
  provider: string;
}

export interface ISandboxProvider {
  start(labSlug: string, userId: string): Promise<SandboxStartResult>;
  reset(sandboxId: string, labSlug: string, userId: string): Promise<{ url: string }>;
  stop(sandboxId: string): Promise<void>;
  isRunning(sandboxId: string): Promise<boolean>;
}

export const SANDBOX_PROVIDER_TOKEN = "SANDBOX_PROVIDER";
