"use client";

// Personal mode — no session restore needed. User is always authenticated locally.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
