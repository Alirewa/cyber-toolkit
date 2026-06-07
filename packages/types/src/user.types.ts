import type { Role } from "./role.types";

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  banReason: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
}

export interface UserSettings {
  userId: string;
  theme: "dark" | "light" | "system";
  language: string;
  notificationPrefs: Record<string, boolean>;
  privacySettings: Record<string, boolean>;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastUsedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}
