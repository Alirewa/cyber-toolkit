"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ChevronLeft, ChevronRight, Wrench,
  History, Target, FlaskConical, TrendingUp,
  AlertTriangle, FileText, Settings, Shield, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

const TOOLS_ITEMS = [
  { href: "/dashboard/tools", icon: Wrench, label: "All Tools", exact: true },
  { href: "/dashboard/tools/history", icon: History, label: "Scan History" },
  { href: "/dashboard/tools/saved", icon: Target, label: "Saved Targets" },
];

const LABS_ITEMS = [
  { href: "/dashboard/labs", icon: FlaskConical, label: "All Labs", exact: true },
  { href: "/dashboard/labs/progress", icon: TrendingUp, label: "My Progress" },
];

const FINDINGS_ITEMS = [
  { href: "/dashboard/ops/findings", icon: AlertTriangle, label: "Findings" },
  { href: "/dashboard/ops/reports", icon: FileText, label: "Reports" },
];

const SETTINGS_ITEMS = [
  { href: "/dashboard/settings/profile", icon: Settings, label: "Profile" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { user } = useAuthStore();

  // Personal mode — no logout
  const handleLogout = () => {
    toast.info("Personal mode — no logout needed.");
  };

  const NavLink = ({ href, icon: Icon, label, exact }: { href: string; icon: React.ElementType; label: string; exact?: boolean }) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-cyber-600/15 text-cyber-400 border border-cyber-600/20"
            : "text-surface-400 hover:bg-surface-800 hover:text-surface-100"
        )}
      >
        <Icon className={cn("size-4 shrink-0", isActive && "text-cyber-400")} />
        {sidebarOpen && <span>{label}</span>}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <>
      <div className="my-3 h-px bg-surface-800" />
      {sidebarOpen && (
        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-surface-600">{label}</p>
      )}
    </>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-surface-800 bg-surface-900/95 backdrop-blur-xl transition-all duration-300",
        sidebarOpen ? "w-[260px]" : "w-[72px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-surface-800 px-4">
        {sidebarOpen && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyber-600">
              <Shield className="size-3.5 text-white" />
            </div>
            <span className="font-bold text-surface-50">Cyber<span className="text-cyber-400">Lab</span></span>
          </Link>
        )}
        {!sidebarOpen && (
          <Link href="/dashboard" className="mx-auto">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyber-600">
              <Shield className="size-3.5 text-white" />
            </div>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "rounded-lg p-1.5 text-surface-500 hover:bg-surface-800 hover:text-surface-200 transition-colors",
            !sidebarOpen && "mx-auto"
          )}
        >
          {sidebarOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Overview */}
        <NavLink href="/dashboard" icon={LayoutDashboard} label="Overview" exact />

        {/* Security Tools */}
        <SectionLabel label="Security Tools" />
        {TOOLS_ITEMS.map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* Bug Bounty Labs */}
        <SectionLabel label="Bug Bounty Labs" />
        {LABS_ITEMS.map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* Findings & Reports */}
        <SectionLabel label="Findings & Reports" />
        {FINDINGS_ITEMS.map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* Settings */}
        <SectionLabel label="Settings" />
        {SETTINGS_ITEMS.map(item => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-surface-800 p-3 space-y-1">
        {sidebarOpen && user && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyber-600/20 border border-cyber-600/30 text-xs font-bold text-cyber-400">
              {user.username[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-surface-200">{user.username}</p>
              <p className="truncate text-xs text-surface-500">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-500 hover:bg-red-600/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="size-4 shrink-0" />
          {sidebarOpen && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
