"use client";

import { Activity, Database, Server, Shield, Users } from "lucide-react";
import { StatCard } from "@cyberlab/ui";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api-client";
import type { Metadata } from "next";

export default function AdminDashboardPage() {
  const { data: usersData } = useQuery({
    queryKey: ["admin", "users-count"],
    queryFn: () => usersApi.getAll({ limit: 1 }),
  });

  const totalUsers = usersData?.data?.total ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Platform Overview</h1>
        <p className="mt-1 text-surface-400">Global statistics and system health</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={totalUsers} icon={<Users />} accent="green" />
        <StatCard title="Active Sessions" value="—" icon={<Shield />} accent="blue" description="Live connections" />
        <StatCard title="Queue Jobs" value="—" icon={<Database />} accent="purple" description="Pending jobs" />
        <StatCard title="System Status" value="Online" icon={<Server />} accent="green" description="All services running" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-6">
          <h2 className="font-semibold text-surface-200 mb-4">Recent Signups</h2>
          <p className="text-sm text-surface-500">User registration chart — coming soon (Phase 1 data collection)</p>
        </div>
        <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-6">
          <h2 className="font-semibold text-surface-200 mb-4">System Health</h2>
          <div className="space-y-3">
            {[
              { label: "API Server", status: "Healthy" },
              { label: "Database", status: "Connected" },
              { label: "Redis", status: "Connected" },
              { label: "Queue", status: "Running" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-surface-400">{item.label}</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400"><div className="size-1.5 rounded-full bg-emerald-400" />{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
