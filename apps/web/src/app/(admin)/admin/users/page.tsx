"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, adminApi } from "@/lib/api-client";
import { Badge, DataTable, EmptyState } from "@cyberlab/ui";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Role } from "@cyberlab/types";
import type { User } from "@cyberlab/types";
import type { Column } from "@cyberlab/ui";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.all({ page, limit, search }),
    queryFn: () => usersApi.getAll({ page, limit, search }),
    placeholderData: (prev) => prev,
  });

  const banMutation = useMutation({
    mutationFn: ({ id, isBanned }: { id: string; isBanned: boolean }) =>
      usersApi.ban(id, isBanned),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(vars.isBanned ? "User banned" : "User unbanned");
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.assignRole(userId, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Role updated"); },
  });

  const users: User[] = (data?.data?.items ?? []) as User[];
  const total = data?.data?.total ?? 0;

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "User",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyber-600/20 text-xs font-bold text-cyber-400">
            {u.username[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-surface-200">{u.username}</p>
            <p className="text-xs text-surface-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => (
        <div className="flex gap-1.5">
          {u.isBanned ? <Badge variant="danger">Banned</Badge>
            : u.isEmailVerified ? <Badge variant="success">Verified</Badge>
            : <Badge variant="warning">Unverified</Badge>}
        </div>
      ),
    },
    {
      key: "roles",
      header: "Role",
      cell: (u) => (
        <select
          value={u.roles?.[0] ?? Role.USER}
          onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value })}
          className="rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-200"
        >
          {Object.values(Role).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      cell: (u) => <span className="text-xs text-surface-400">{formatDate(u.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (u) => (
        <button
          onClick={() => banMutation.mutate({ id: u.id, isBanned: !u.isBanned })}
          disabled={banMutation.isPending}
          className={`text-xs font-medium transition-colors ${u.isBanned ? "text-cyber-400 hover:text-cyber-300" : "text-red-400 hover:text-red-300"}`}
        >
          {u.isBanned ? "Unban" : "Ban"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">User Management</h1>
        <p className="mt-1 text-surface-400">Manage platform users, roles, and access</p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by email or username..."
        keyExtractor={(u) => u.id}
        emptyState={<EmptyState title="No users found" description="Try a different search term." />}
      />
    </div>
  );
}
