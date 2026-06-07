"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, ChevronLeft, ChevronRight, LogOut, Server, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

const ADMIN_NAV = [
  { href: "/admin", icon: BarChart3, label: "Platform Stats", exact: true },
  { href: "/admin/users", icon: Users, label: "User Management" },
  { href: "/admin/audit-logs", icon: Activity, label: "Audit Logs" },
  { href: "/admin/system", icon: Server, label: "System Health" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { user } = useAuthStore();

  // Personal mode — logout is a no-op
  const handleLogout = () => {
    toast.info("Personal mode — no logout needed.");
  };

  return (
    <aside className={cn("fixed left-0 top-0 z-40 flex h-full flex-col border-r border-red-900/30 bg-surface-900/95 backdrop-blur-xl transition-all duration-300", sidebarOpen ? "w-[260px]" : "w-[72px]")}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-red-900/30 px-4">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/80">
              <Shield className="size-3.5 text-white" />
            </div>
            <span className="font-bold text-surface-50">Admin<span className="text-red-400"> Panel</span></span>
          </div>
        )}
        {!sidebarOpen && <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/80"><Shield className="size-3.5 text-white" /></div>}
        <button onClick={toggleSidebar} className={cn("rounded-lg p-1.5 text-surface-500 hover:bg-surface-800 hover:text-surface-200 transition-colors", !sidebarOpen && "mx-auto")}>
          {sidebarOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {ADMIN_NAV.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", isActive ? "bg-red-600/15 text-red-400 border border-red-600/20" : "text-surface-400 hover:bg-surface-800 hover:text-surface-100")}>
              <item.icon className={cn("size-4 shrink-0", isActive && "text-red-400")} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
        <div className="my-3 h-px bg-surface-800" />
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-500 hover:bg-surface-800 hover:text-surface-300 transition-colors">
          <ChevronLeft className="size-4 shrink-0" />
          {sidebarOpen && <span>Back to Dashboard</span>}
        </Link>
      </nav>

      {/* User */}
      <div className="border-t border-surface-800 p-3">
        {sidebarOpen && user && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600/20 border border-red-600/30 text-xs font-bold text-red-400">{user.username[0]?.toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium text-surface-200">{user.username}</p><p className="truncate text-xs text-red-400/70">Admin</p></div>
          </div>
        )}
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-500 hover:bg-red-600/10 hover:text-red-400 transition-colors">
          <LogOut className="size-4 shrink-0" />
          {sidebarOpen && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
