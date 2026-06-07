"use client";

import { SocketProvider } from "@/components/providers/socket-provider";
import { AdminSidebar } from "@/components/layouts/admin/admin-sidebar";
import { AdminTopbar } from "@/components/layouts/admin/admin-topbar";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <SocketProvider>
      <div className="flex h-screen overflow-hidden bg-surface-950">
        <AdminSidebar />
        <div className={cn("flex flex-1 flex-col overflow-hidden transition-all duration-300", sidebarOpen ? "lg:ml-[260px]" : "lg:ml-[72px]")}>
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SocketProvider>
  );
}
