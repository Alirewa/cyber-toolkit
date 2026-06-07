export enum ApiKeyScope {
  FULL_ACCESS = "FULL_ACCESS",
  READ_ONLY = "READ_ONLY",
  TOOLS_ONLY = "TOOLS_ONLY",
  LABS_ONLY = "LABS_ONLY",
  REPORTING_ONLY = "REPORTING_ONLY",
}

export enum BackupStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

export interface FeatureFlagOverride {
  id: string;
  flagName: string;
  organizationId: string | null;
  userId: string | null;
  isEnabled: boolean;
  rolloutPct: number;
  config: Record<string, unknown> | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface FeatureFlagWithOverrides {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  rolloutPct: number;
  environments: string[];
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  overrides: FeatureFlagOverride[];
}

export interface ApiUsageSummary {
  endpoint: string;
  method: string;
  count: number;
  avgDurationMs: number;
  errorCount: number;
  date: string;
}

export interface ApiQuotaStatus {
  apiKeyId: string;
  quotaPerDay: number | null;
  usageToday: number;
  percentUsed: number;
  resetAt: string | null;
}

export interface BackupRecord {
  id: string;
  organizationId: string | null;
  type: string;
  status: BackupStatus;
  sizeBytes: string | null;
  storageKey: string | null;
  checksum: string | null;
  startedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditArchive {
  id: string;
  organizationId: string | null;
  period: string;
  recordCount: number;
  storageKey: string;
  sizeBytes: string;
  archivedAt: string;
  expiresAt: string | null;
}

export interface InfraHealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}
