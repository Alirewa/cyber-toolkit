export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface ApiKeyWithSecret extends ApiKey {
  key: string;
}
