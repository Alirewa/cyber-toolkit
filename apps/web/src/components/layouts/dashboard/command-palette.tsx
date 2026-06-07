"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, Bell, Key, LayoutDashboard, Settings, Shield, Wrench, Globe, Network, ShieldCheck, FileCode, Hash, Binary, KeyRound, Layers, ShieldAlert, Bot, Tags, History, Target } from "lucide-react";
import { CommandPalette } from "@cyberlab/ui";
import { useUiStore } from "@/stores/ui.store";

const COMMANDS = [
  { id: "dashboard", label: "Dashboard Overview", icon: <LayoutDashboard />, group: "Navigate", href: "/dashboard" },
  { id: "notifications", label: "Notifications", icon: <Bell />, group: "Navigate", href: "/dashboard/notifications" },
  { id: "activity", label: "Activity Feed", icon: <Activity />, group: "Navigate", href: "/dashboard/activity" },
  { id: "api-keys", label: "API Keys", icon: <Key />, group: "Navigate", href: "/dashboard/api-keys" },
  { id: "profile", label: "Profile Settings", icon: <Settings />, group: "Settings", href: "/dashboard/settings/profile" },
  { id: "security", label: "Security Settings", icon: <Shield />, group: "Settings", href: "/dashboard/settings/security" },
  // Tools
  { id: "tools", label: "All Cyber Tools", icon: <Wrench />, group: "Tools", href: "/dashboard/tools" },
  { id: "tool-history", label: "Scan History", icon: <History />, group: "Tools", href: "/dashboard/tools/history" },
  { id: "saved-targets", label: "Saved Targets", icon: <Target />, group: "Tools", href: "/dashboard/tools/saved" },
  { id: "tool-whois", label: "WHOIS Lookup", icon: <Globe />, group: "Tools", href: "/dashboard/tools/whois" },
  { id: "tool-dns", label: "DNS Lookup", icon: <Network />, group: "Tools", href: "/dashboard/tools/dns-lookup" },
  { id: "tool-ssl", label: "SSL Certificate Checker", icon: <ShieldCheck />, group: "Tools", href: "/dashboard/tools/ssl-checker" },
  { id: "tool-headers", label: "HTTP Header Analyzer", icon: <FileCode />, group: "Tools", href: "/dashboard/tools/http-headers" },
  { id: "tool-security-headers", label: "Security Headers Checker", icon: <ShieldAlert />, group: "Tools", href: "/dashboard/tools/security-headers" },
  { id: "tool-tech", label: "Technology Detector", icon: <Layers />, group: "Tools", href: "/dashboard/tools/tech-detector" },
  { id: "tool-robots", label: "robots.txt Analyzer", icon: <Bot />, group: "Tools", href: "/dashboard/tools/robots-txt" },
  { id: "tool-metadata", label: "Metadata Viewer", icon: <Tags />, group: "Tools", href: "/dashboard/tools/metadata-viewer" },
  { id: "tool-base64", label: "Base64 Encode / Decode", icon: <Binary />, group: "Tools", href: "/dashboard/tools/base64" },
  { id: "tool-hash", label: "Hash Generator", icon: <Hash />, group: "Tools", href: "/dashboard/tools/hash-generator" },
  { id: "tool-jwt", label: "JWT Decoder", icon: <KeyRound />, group: "Tools", href: "/dashboard/tools/jwt-decoder" },
];

export function DashboardCommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore();
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandPaletteOpen]);

  const items = COMMANDS.map((cmd) => ({
    ...cmd,
    onSelect: () => router.push(cmd.href),
  }));

  return (
    <CommandPalette
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      items={items}
      placeholder="Search pages and actions..."
    />
  );
}
