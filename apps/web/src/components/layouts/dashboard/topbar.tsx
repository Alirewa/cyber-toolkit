"use client";

import { Bell, Search, Settings } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { useNotificationsStore } from "@/stores/notifications.store";
import { useAuthStore } from "@/stores/auth.store";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function DashboardTopbar() {
  const { toggleCommandPalette } = useUiStore();
  const { unreadCount } = useNotificationsStore();
  const { user } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-800 bg-surface-900/80 backdrop-blur-xl px-6 sticky top-0 z-30">
      {/* Search trigger */}
      <button
        onClick={toggleCommandPalette}
        className="flex items-center gap-3 rounded-lg border border-surface-700 bg-surface-800/50 px-3 py-2 text-sm text-surface-500 hover:border-surface-600 hover:bg-surface-800 transition-colors w-full max-w-xs"
      >
        <Search className="size-4" />
        <span>Search or jump to...</span>
        <kbd className="ml-auto text-xs text-surface-600 font-mono">⌘K</kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyber-600 text-[10px] font-bold text-white",
              unreadCount > 9 && "px-1"
            )}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Settings */}
        <Link href="/dashboard/settings/profile" className="flex h-9 w-9 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors">
          <Settings className="size-4" />
        </Link>

        {/* Avatar */}
        {user && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyber-600/20 border border-cyber-600/30 text-sm font-bold text-cyber-400 cursor-default select-none">
            {user.username[0]?.toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
