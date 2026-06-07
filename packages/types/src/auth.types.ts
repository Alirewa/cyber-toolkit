import type { User } from "./user.types";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  user: User;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}
