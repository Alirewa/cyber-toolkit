export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  USER = "USER",
}

export interface RoleEntity {
  id: string;
  name: Role;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}
