"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { organizationsApi } from "@/lib/api-client";
import { Building2, Users } from "lucide-react";
import { useState } from "react";

const PLAN_BADGE: Record<string, string> = {
  FREE: "bg-surface-800 text-surface-400",
  PRO: "bg-blue-900/40 text-blue-400",
  TEAM: "bg-purple-900/40 text-purple-400",
  ENTERPRISE: "bg-cyber-900/40 text-cyber-400",
};

export default function AdminOrganizationsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.organizations.list(page, search),
    queryFn: () => organizationsApi.getAll({ page, limit: 20, search: search || undefined }),
  });

  type OrgItem = { id: string; name: string; slug: string; planTier: string; isActive: boolean; createdAt: string; _count?: { members: number }; subscription?: unknown };
  const orgs = (data?.data?.items ?? []) as OrgItem[];
  const total = data?.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Organizations</h1>
          <p className="text-sm text-surface-400 mt-1">{total} organizations</p>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search organizations..."
        className="w-full max-w-xs h-9 rounded-lg border border-surface-700 bg-surface-900 px-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none"
      />

      <div className="rounded-xl border border-surface-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-800 bg-surface-900/80">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Organization</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Members</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800/50">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-5 rounded bg-surface-800 animate-pulse w-full" /></td></tr>
                ))
              : orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-800 border border-surface-700">
                          <Building2 className="size-4 text-surface-500" />
                        </div>
                        <div>
                          <p className="font-medium text-surface-200">{org.name}</p>
                          <p className="text-xs text-surface-500">@{org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE[org.planTier] ?? PLAN_BADGE.FREE}`}>
                        {org.planTier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-surface-400">
                        <Users className="size-3" />
                        <span className="text-sm">{(org as { _count?: { members: number } })._count?.members ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${org.isActive ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                        {org.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-500">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
