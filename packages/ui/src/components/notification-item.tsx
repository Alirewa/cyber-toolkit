"use client";

import * as React from "react";
import { AlertTriangle, Bell, CheckCircle, Info, Zap } from "lucide-react";
import type { Notification, NotificationType } from "@cyberlab/types";
import { cn } from "../lib/utils";

const typeConfig: Record<
  NotificationType,
  { icon: React.ReactNode; color: string }
> = {
  SECURITY_ALERT: {
    icon: <AlertTriangle className="size-4" />,
    color: "text-red-400 bg-red-400/10",
  },
  SYSTEM: {
    icon: <Zap className="size-4" />,
    color: "text-amber-400 bg-amber-400/10",
  },
  INFO: {
    icon: <Info className="size-4" />,
    color: "text-sky-400 bg-sky-400/10",
  },
  SUCCESS: {
    icon: <CheckCircle className="size-4" />,
    color: "text-emerald-400 bg-emerald-400/10",
  },
  WARNING: {
    icon: <Bell className="size-4" />,
    color: "text-orange-400 bg-orange-400/10",
  },
};

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const config = typeConfig[notification.type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-3 transition-colors cursor-pointer",
        notification.isRead
          ? "hover:bg-surface-800/30"
          : "bg-surface-800/50 hover:bg-surface-800"
      )}
      onClick={() => !notification.isRead && onRead?.(notification.id)}
    >
      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.color)}>
        {config.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm font-medium", notification.isRead ? "text-surface-400" : "text-surface-100")}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="size-2 shrink-0 rounded-full bg-cyber-500" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-surface-500 line-clamp-2">{notification.message}</p>
        <p className="mt-1 text-xs text-surface-600">
          {new Date(notification.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
