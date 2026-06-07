export enum OrgRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  SECURITY_MANAGER = "SECURITY_MANAGER",
  TEAM_LEAD = "TEAM_LEAD",
  ANALYST = "ANALYST",
  MEMBER = "MEMBER",
  READ_ONLY = "READ_ONLY",
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  logoUrl: string | null;
  planTier: PlanTier;
  isActive: boolean;
  maxMembers: number;
  maxApiKeys: number;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OrganizationMember {
  organizationId: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
  invitedById: string | null;
  user?: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
}

export enum PlanTier {
  FREE = "FREE",
  PRO = "PRO",
  TEAM = "TEAM",
  ENTERPRISE = "ENTERPRISE",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  TRIALING = "TRIALING",
  PAST_DUE = "PAST_DUE",
  CANCELLED = "CANCELLED",
  PAUSED = "PAUSED",
}

export enum BillingEventType {
  SUBSCRIPTION_CREATED = "SUBSCRIPTION_CREATED",
  SUBSCRIPTION_UPGRADED = "SUBSCRIPTION_UPGRADED",
  SUBSCRIPTION_CANCELLED = "SUBSCRIPTION_CANCELLED",
  PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  INVOICE_GENERATED = "INVOICE_GENERATED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
}

export interface Plan {
  id: string;
  tier: PlanTier;
  name: string;
  maxMembers: number;
  maxApiKeys: number;
  maxWorkflows: number;
  maxFindings: number;
  hasAdvancedRbac: boolean;
  hasObservability: boolean;
  hasSso: boolean;
  hasCustomRoles: boolean;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  features: string[];
}

export interface Subscription {
  id: string;
  organizationId: string;
  planTier: PlanTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingEvent {
  id: string;
  organizationId: string;
  type: BillingEventType;
  metadata: Record<string, unknown> | null;
  amountCents: number | null;
  createdAt: string;
}

export interface TenantSettings {
  organizationId: string;
  allowedDomains: string[];
  ssoEnabled: boolean;
  ssoProvider: string | null;
  mfaRequired: boolean;
  sessionTtlHours: number;
  ipAllowlist: string[];
  customBranding: Record<string, unknown>;
  dataRetentionDays: number;
  updatedAt: string;
}
