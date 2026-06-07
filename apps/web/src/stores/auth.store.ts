import { create } from "zustand";
import { Role } from "@cyberlab/types";
import type { User } from "@cyberlab/types";

// Personal mode — hardcoded local user. No login required.
const LOCAL_USER: User = {
  id: "local-user-001",
  email: "admin@cyberlab.local",
  username: "admin",
  avatarUrl: null,
  bio: null,
  isEmailVerified: true,
  isActive: true,
  isBanned: false,
  banReason: null,
  lastLoginAt: new Date(),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date(),
  roles: [Role.ADMIN],
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(() => ({
  user: LOCAL_USER,
  accessToken: "local-bypass-token",
  isAuthenticated: true,
  isLoading: false,
  // In personal mode these are no-ops — user is always authenticated
  setUser: () => {},
  setAccessToken: () => {},
  setLoading: () => {},
  logout: () => {},
}));
