"use client";

import { SocketProvider } from "@/components/providers/socket-provider";
import { DashboardSidebar } from "@/components/layouts/dashboard/sidebar";
import { DashboardTopbar } from "@/components/layouts/dashboard/topbar";
import { DashboardCommandPalette } from "@/components/layouts/dashboard/command-palette";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

// Personal mode — no auth guard. Dashboard loads directly.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <SocketProvider>
      <div className="flex h-screen overflow-hidden bg-surface-950">
        <DashboardSidebar />
        <div
          className={cn(
            "flex flex-1 flex-col overflow-hidden transition-all duration-300",
            sidebarOpen ? "lg:ml-[260px]" : "lg:ml-[72px]"
          )}
        >
          <DashboardTopbar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
        <DashboardCommandPalette />
      </div>
    </SocketProvider>
  );
}
