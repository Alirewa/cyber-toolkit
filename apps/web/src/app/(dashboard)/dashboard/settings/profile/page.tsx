"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { usersApi } from "@/lib/api-client";
import { toast } from "sonner";
import type { Metadata } from "next";

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: user?.username ?? "", bio: user?.bio ?? "" },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => usersApi.updateMe(data),
    onSuccess: (res) => {
      setUser(res.data);
      toast.success("Profile updated");
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Profile Settings</h1>
        <p className="mt-1 text-surface-400">Update your public profile information</p>
      </div>

      {/* Avatar */}
      <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-6 space-y-4">
        <h2 className="font-semibold text-surface-200">Avatar</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyber-600/20 border-2 border-cyber-600/30 text-xl font-bold text-cyber-400">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-surface-400">Avatar upload coming in a future update.</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-6">
        <h2 className="font-semibold text-surface-200 mb-4">Account Information</h2>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-300">Email address</label>
            <input disabled value={user?.email} className="w-full h-10 rounded-lg border border-surface-800 bg-surface-800/50 px-3 text-sm text-surface-500 cursor-not-allowed" />
            <p className="text-xs text-surface-600">Email cannot be changed</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-300">Username</label>
            <input {...register("username")} className="w-full h-10 rounded-lg border border-surface-700 bg-surface-900 px-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none focus:ring-1 focus:ring-cyber-500/50 transition-colors" />
            {errors.username && <p className="text-xs text-red-400">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-300">Bio</label>
            <textarea {...register("bio")} rows={3} placeholder="Tell us a bit about yourself..." className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none focus:ring-1 focus:ring-cyber-500/50 transition-colors resize-none" />
            {errors.bio && <p className="text-xs text-red-400">{errors.bio.message}</p>}
          </div>

          <button type="submit" disabled={!isDirty || isSubmitting || mutation.isPending} className="rounded-lg bg-cyber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyber-500 disabled:opacity-50 transition-colors">
            {mutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
