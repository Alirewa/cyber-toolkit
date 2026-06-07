import { axiosInstance } from "./axios-instance";
import type { User, AuthTokens, Notification, ApiKey, ApiKeyWithSecret, AuditLog, PaginatedResult, PaginationMeta } from "@cyberlab/types";

type ApiResponse<T> = Promise<{ data: T; message: string; meta?: PaginationMeta }>;

// ─── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
  register: (dto: { username: string; email: string; password: string }) =>
    axiosInstance.post<{ data: { message: string }; message: string }>("/auth/register", dto).then((r) => r.data),

  login: (dto: { email: string; password: string }) =>
    axiosInstance.post<{ data: { accessToken: string; user: User }; message: string }>("/auth/login", dto).then((r) => r.data),

  refresh: () =>
    axiosInstance.post<{ data: { accessToken: string }; message: string }>("/auth/refresh").then((r) => r.data),

  logout: () =>
    axiosInstance.post<{ data: null }>("/auth/logout").then((r) => r.data),

  me: () =>
    axiosInstance.get<{ data: User; message: string }>("/auth/me").then((r) => r.data),

  forgotPassword: (email: string) =>
    axiosInstance.post("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (dto: { token: string; newPassword: string }) =>
    axiosInstance.post("/auth/reset-password", dto).then((r) => r.data),

  changePassword: (dto: { currentPassword: string; newPassword: string }) =>
    axiosInstance.post("/auth/change-password", dto).then((r) => r.data),

  getSessions: () =>
    axiosInstance.get<{ data: Array<{ id: string; ipAddress: string | null; userAgent: string | null; lastUsedAt: string; createdAt: string }> }>("/auth/sessions").then((r) => r.data),

  revokeSession: (sessionId: string) =>
    axiosInstance.delete(`/auth/sessions/${sessionId}`).then((r) => r.data),

  revokeAllOtherSessions: () =>
    axiosInstance.delete("/auth/sessions").then((r) => r.data),
};

// ─── Users ────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => axiosInstance.get<{ data: User }>("/users/me").then((r) => r.data),

  updateMe: (dto: { username?: string; bio?: string; avatarUrl?: string }) =>
    axiosInstance.patch<{ data: User }>("/users/me", dto).then((r) => r.data),

  getAll: (params?: Record<string, unknown>) =>
    axiosInstance.get<{ data: PaginatedResult<User> }>("/users", { params }).then((r) => r.data),

  getById: (id: string) =>
    axiosInstance.get<{ data: User }>(`/users/${id}`).then((r) => r.data),

  ban: (id: string, isBanned: boolean, banReason?: string) =>
    axiosInstance.patch<{ data: User }>(`/users/${id}/ban`, { isBanned, banReason }).then((r) => r.data),

  delete: (id: string) =>
    axiosInstance.delete(`/users/${id}`).then((r) => r.data),
};

// ─── Notifications ────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: PaginatedResult<Notification> }>("/notifications", { params }).then((r) => r.data),

  getUnreadCount: () =>
    axiosInstance.get<{ data: { count: number } }>("/notifications/unread-count").then((r) => r.data),

  markAsRead: (id: string) =>
    axiosInstance.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    axiosInstance.patch("/notifications/read-all").then((r) => r.data),
};

// ─── API Keys ─────────────────────────────────────────────────────────
export const apiKeysApi = {
  getAll: () =>
    axiosInstance.get<{ data: ApiKey[] }>("/api-keys").then((r) => r.data),

  create: (dto: { name: string; expiresAt?: Date }) =>
    axiosInstance.post<{ data: ApiKeyWithSecret }>("/api-keys", dto).then((r) => r.data),

  revoke: (id: string) =>
    axiosInstance.delete(`/api-keys/${id}`).then((r) => r.data),
};

// ─── Audit Logs ───────────────────────────────────────────────────────
export const auditLogsApi = {
  getAll: (params?: Record<string, unknown>) =>
    axiosInstance.get<{ data: PaginatedResult<AuditLog> }>("/audit-logs", { params }).then((r) => r.data),

  getMine: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: PaginatedResult<AuditLog> }>("/audit-logs/me", { params }).then((r) => r.data),
};

// ─── Tools ────────────────────────────────────────────────────────────
export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "NETWORK" | "ANALYSIS" | "ENCODING";
  icon: string;
  isNetwork: boolean;
  isInstant: boolean;
  isEnabled: boolean;
  inputSchema: {
    fields: Array<{
      key: string;
      label: string;
      type: "text" | "url" | "select" | "textarea";
      placeholder?: string;
      required: boolean;
      options?: string[];
      helpText?: string;
    }>;
  };
}

export interface ToolRun {
  id: string;
  userId: string;
  toolId: string;
  input: Record<string, string>;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMEOUT";
  result: unknown | null;
  errorMessage: string | null;
  executionMs: number | null;
  createdAt: string;
  completedAt: string | null;
  tool?: { slug: string; name: string; icon: string; category: string };
}

export interface SavedTarget {
  id: string;
  userId: string;
  label: string;
  target: string;
  notes: string | null;
  createdAt: string;
}

export const toolsApi = {
  getAll: () =>
    axiosInstance.get<{ data: ToolDefinition[] }>("/tools").then((r) => r.data),

  getBySlug: (slug: string) =>
    axiosInstance.get<{ data: ToolDefinition }>(`/tools/${slug}`).then((r) => r.data),

  run: (slug: string, input: Record<string, string>) =>
    axiosInstance
      .post<{ data: { runId: string; status: string; jobId?: string | number; result?: unknown } }>(
        `/tools/${slug}/run`,
        { input },
      )
      .then((r) => r.data),

  getRuns: (params?: { page?: number; limit?: number; toolSlug?: string; status?: string }) =>
    axiosInstance
      .get<{ data: PaginatedResult<ToolRun> }>("/tools/runs", { params })
      .then((r) => r.data),

  getRun: (id: string) =>
    axiosInstance.get<{ data: ToolRun }>(`/tools/runs/${id}`).then((r) => r.data),

  deleteRun: (id: string) =>
    axiosInstance.delete(`/tools/runs/${id}`).then((r) => r.data),
};

export const savedTargetsApi = {
  getAll: () =>
    axiosInstance.get<{ data: SavedTarget[] }>("/tools/saved-targets").then((r) => r.data),

  create: (dto: { label: string; target: string; notes?: string }) =>
    axiosInstance.post<{ data: SavedTarget }>("/tools/saved-targets", dto).then((r) => r.data),

  delete: (id: string) =>
    axiosInstance.delete(`/tools/saved-targets/${id}`).then((r) => r.data),
};

// ─── Labs (Bug Bounty Academy) ───────────────────────────────────────
export type LabDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type LabCategory =
  | "XSS" | "CSRF" | "SQL_INJECTION" | "IDOR" | "AUTHENTICATION"
  | "ACCESS_CONTROL" | "JWT" | "SSRF" | "FILE_UPLOAD" | "MISCONFIGURATION" | "OWASP_TOP10";

export interface LabHint {
  key: string;
  order: number;
  title: string;
  content: string;
  xpCost: number;
}

export interface LabStep {
  order: number;
  title: string;
  instruction: string;
  codeExample?: string;
}

export interface LabQuestion {
  key: string;
  label: string;
  type: "text" | "code" | "select" | "flag" | "multi";
  points: number;
  placeholder?: string;
  options?: string[];
  helpText?: string;
  context?: string;
}

export interface LabUserProgress {
  isCompleted: boolean;
  bestScore: number;
  attempts: number;
}

export interface LabDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  objective: string;
  category: LabCategory;
  difficulty: LabDifficulty;
  icon: string;
  xpReward: number;
  estimatedMin: number;
  isSandboxed: boolean;
  hints: LabHint[];
  steps: LabStep[];
  questions: LabQuestion[];
  tags?: string[];
  userProgress?: LabUserProgress | null;
  activeSession?: { id: string; sandboxUrl?: string | null; status: string } | null;
}

export interface QuestionFeedback {
  correct: boolean;
  message: string;
  explanation: string;
  expectedValue?: string;
}

export interface SubmitResult {
  submissionId: string;
  passed: boolean;
  score: number;
  maxScore: number;
  xpEarned: number;
  hintsUsed: number;
  feedback: Record<string, QuestionFeedback>;
}

export interface UserScore {
  userId: string;
  totalXp: number;
  level: number;
  labsDone: number;
  streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
  labsDone: number;
}

export interface LearningPath {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  labSlugs: string[];
}

export const labsApi = {
  getAll: (params?: { difficulty?: string; category?: string; search?: string }) =>
    axiosInstance.get<{ data: LabDefinition[] }>("/labs", { params }).then((r) => r.data),

  getBySlug: (slug: string) =>
    axiosInstance.get<{ data: LabDefinition }>(`/labs/${slug}`).then((r) => r.data),

  start: (slug: string) =>
    axiosInstance.post<{ data: { id: string; sandboxUrl?: string | null } }>(`/labs/${slug}/start`).then((r) => r.data),

  resetSession: (slug: string) =>
    axiosInstance.delete<{ data: { sessionId: string; sandboxUrl?: string | null } }>(`/labs/${slug}/session`).then((r) => r.data),

  getHint: (slug: string, key: string) =>
    axiosInstance.get<{ data: { key: string; title: string; content: string; xpCost: number } }>(`/labs/${slug}/hints/${key}`).then((r) => r.data),

  submit: (slug: string, answers: Record<string, string>, sessionId?: string) =>
    axiosInstance.post<{ data: SubmitResult }>(`/labs/${slug}/submit`, { answers, sessionId }).then((r) => r.data),

  getMyProgress: () =>
    axiosInstance.get<{ data: { score: UserScore; levelInfo: { current: number; next: number; levelName: string }; progress: unknown[]; stats: { completed: number; total: number; percentComplete: number } } }>("/labs/my-progress").then((r) => r.data),

  getMyAchievements: () =>
    axiosInstance.get<{ data: Array<{ achievement: { slug: string; name: string; description: string; icon: string; xpReward: number }; earnedAt: string }> }>("/labs/my-achievements").then((r) => r.data),

  getMyScore: () =>
    axiosInstance.get<{ data: UserScore }>("/labs/scores/me").then((r) => r.data),

  getLeaderboard: () =>
    axiosInstance.get<{ data: LeaderboardEntry[] }>("/labs/leaderboard").then((r) => r.data),

  getLearningPaths: () =>
    axiosInstance.get<{ data: LearningPath[] }>("/labs/learning-paths").then((r) => r.data),

  getSubmissions: (params?: { page?: number; limit?: number; labSlug?: string }) =>
    axiosInstance.get<{ data: PaginatedResult<unknown> }>("/labs/submissions", { params }).then((r) => r.data),
};

// ─── Community ───────────────────────────────────────────────────────
export interface PublicProfile {
  id: string; username: string; avatarUrl: string | null; bio: string | null;
  createdAt: string; labsCompleted: number; reputation: number;
  tier: { name: string; badge: string };
  isFollowing: boolean;
  score: { totalXp: number; level: number; labsDone: number; streak: number } | null;
  profileExtension: { skills: string[]; interests: string[]; githubUrl?: string; twitterUrl?: string; linkedinUrl?: string; websiteUrl?: string; isPublic: boolean } | null;
  _count: { followers: number; following: number; writeups: number; discussions: number };
  recentWriteups: Array<{ id: string; title: string; slug: string; category: string; viewCount: number; likeCount: number; publishedAt: string }>;
  achievements: Array<{ achievement: { slug: string; name: string; description: string; icon: string }; earnedAt: string }>;
}

export interface ActivityItem {
  id: string; type: string; resourceType?: string; resourceId?: string; metadata?: unknown; createdAt: string;
  actor: { id: string; username: string; avatarUrl: string | null };
}

export interface TeamSummary {
  id: string; slug: string; name: string; description?: string; avatarUrl?: string; isPublic: boolean;
  totalXp: number; createdAt: string; _count: { members: number };
}

export interface TeamDetail extends TeamSummary {
  myRole: string | null;
  members: Array<{ userId: string; role: string; joinedAt: string; user: { id: string; username: string; avatarUrl: string | null; bio: string | null; score: { level: number; totalXp: number } | null } }>;
  activityLogs: Array<{ id: string; type: string; createdAt: string; user: { username: string; avatarUrl: string | null } }>;
}

export interface DiscussionSummary {
  id: string; title: string; category: string; tags: string[]; status: string;
  voteScore: number; replyCount: number; viewCount: number; isPinned: boolean; createdAt: string;
  author: { id: string; username: string; avatarUrl: string | null; score: { level: number } | null };
}

export interface WriteupSummary {
  id: string; slug: string; title: string; summary?: string; category: string; tags: string[];
  visibility: string; viewCount: number; likeCount: number; isDraft: boolean; publishedAt?: string; updatedAt: string;
  author: { id: string; username: string; avatarUrl: string | null };
}

export interface Note {
  id: string; title: string; body: string; labId?: string; tags: string[]; isPinned: boolean; createdAt: string; updatedAt: string;
}

export interface MentorProfile {
  userId: string; bio?: string; expertise: string[]; maxStudents: number; isActive: boolean; totalSessions: number; rating: number;
  user: { id: string; username: string; avatarUrl: string | null; bio: string | null; score: { level: number; totalXp: number } | null };
}

export interface ReputationLeaderEntry {
  rank: number; userId: string; username: string; avatarUrl: string | null; reputation: number;
  tier: { name: string; badge: string };
}

export const communityApi = {
  search: (q: string, type?: string) =>
    axiosInstance.get<{ data: Record<string, unknown[]> }>("/community/search", { params: { q, type } }).then((r) => r.data),
  getFeed: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { items: ActivityItem[]; total: number } }>("/community/feed", { params }).then((r) => r.data),
  getLeaderboard: (limit = 50) =>
    axiosInstance.get<{ data: ReputationLeaderEntry[] }>("/community/leaderboard", { params: { limit } }).then((r) => r.data),
  getProfile: (username: string) =>
    axiosInstance.get<{ data: PublicProfile }>(`/community/profile/${username}`).then((r) => r.data),
  getMyProfile: () =>
    axiosInstance.get<{ data: PublicProfile }>("/community/profile/me").then((r) => r.data),
  updateProfile: (dto: Partial<{ skills: string[]; interests: string[]; githubUrl: string; twitterUrl: string; linkedinUrl: string; websiteUrl: string; isPublic: boolean }>) =>
    axiosInstance.patch("/community/profile/me", dto).then((r) => r.data),
  follow: (username: string) =>
    axiosInstance.post<{ data: { following: boolean } }>(`/community/follow/${username}`).then((r) => r.data),
  unfollow: (username: string) =>
    axiosInstance.delete<{ data: { following: boolean } }>(`/community/follow/${username}`).then((r) => r.data),
  getFollowers: (username: string, params?: { page?: number; limit?: number }) =>
    axiosInstance.get(`/community/profile/${username}/followers`, { params }).then((r) => r.data),
  getFollowing: (username: string, params?: { page?: number; limit?: number }) =>
    axiosInstance.get(`/community/profile/${username}/following`, { params }).then((r) => r.data),
  toggleBookmark: (resourceType: string, resourceId: string) =>
    axiosInstance.post<{ data: { bookmarked: boolean } }>(`/community/bookmarks/${resourceType}/${resourceId}`).then((r) => r.data),
  getBookmarks: (params?: { type?: string; page?: number }) =>
    axiosInstance.get("/community/bookmarks", { params }).then((r) => r.data),
};

export const teamsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    axiosInstance.get<{ data: { items: TeamSummary[]; total: number } }>("/teams", { params }).then((r) => r.data),
  create: (dto: { name: string; slug: string; description?: string; avatarUrl?: string; isPublic?: boolean }) =>
    axiosInstance.post<{ data: TeamDetail }>("/teams", dto).then((r) => r.data),
  getBySlug: (slug: string) =>
    axiosInstance.get<{ data: TeamDetail }>(`/teams/${slug}`).then((r) => r.data),
  invite: (slug: string, dto: { username: string; role?: string }) =>
    axiosInstance.post(`/teams/${slug}/invite`, dto).then((r) => r.data),
  removeMember: (slug: string, userId: string) =>
    axiosInstance.delete(`/teams/${slug}/members/${userId}`).then((r) => r.data),
  updateRole: (slug: string, userId: string, role: string) =>
    axiosInstance.patch(`/teams/${slug}/members/${userId}/role`, { role }).then((r) => r.data),
  getMyInvitations: () =>
    axiosInstance.get("/teams/invitations/me").then((r) => r.data),
  respondToInvitation: (id: string, accept: boolean) =>
    axiosInstance.post(`/teams/invitations/${id}/respond`, { accept }).then((r) => r.data),
};

export const discussionsApi = {
  list: (params?: { page?: number; limit?: number; category?: string; sort?: string; search?: string }) =>
    axiosInstance.get<{ data: { items: DiscussionSummary[]; total: number } }>("/discussions", { params }).then((r) => r.data),
  create: (dto: { title: string; body: string; labId?: string; category?: string; tags?: string[] }) =>
    axiosInstance.post("/discussions", dto).then((r) => r.data),
  getById: (id: string) =>
    axiosInstance.get(`/discussions/${id}`).then((r) => r.data),
  delete: (id: string) =>
    axiosInstance.delete(`/discussions/${id}`).then((r) => r.data),
  createReply: (id: string, dto: { body: string; parentId?: string }) =>
    axiosInstance.post(`/discussions/${id}/replies`, dto).then((r) => r.data),
  deleteReply: (replyId: string) =>
    axiosInstance.delete(`/discussions/replies/${replyId}`).then((r) => r.data),
  markAccepted: (id: string, replyId: string) =>
    axiosInstance.patch(`/discussions/${id}/replies/${replyId}/accept`).then((r) => r.data),
  vote: (id: string, value: 1 | -1) =>
    axiosInstance.post(`/discussions/${id}/vote`, { value }).then((r) => r.data),
  voteReply: (replyId: string, value: 1 | -1) =>
    axiosInstance.post(`/discussions/replies/${replyId}/vote`, { value }).then((r) => r.data),
};

export const writeupsApi = {
  list: (params?: { page?: number; limit?: number; category?: string; tag?: string; search?: string }) =>
    axiosInstance.get<{ data: { items: WriteupSummary[]; total: number } }>("/writeups", { params }).then((r) => r.data),
  create: (dto: Partial<{ title: string; body: string; summary: string; category: string; tags: string[]; visibility: string; labId: string; isDraft: boolean }>) =>
    axiosInstance.post("/writeups", dto).then((r) => r.data),
  getMyWriteups: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { items: WriteupSummary[]; total: number } }>("/writeups/me", { params }).then((r) => r.data),
  getBySlug: (slug: string) =>
    axiosInstance.get(`/writeups/${slug}`).then((r) => r.data),
  update: (id: string, dto: unknown) =>
    axiosInstance.patch(`/writeups/${id}`, dto).then((r) => r.data),
  delete: (id: string) =>
    axiosInstance.delete(`/writeups/${id}`).then((r) => r.data),
  getMyNotes: (labId?: string) =>
    axiosInstance.get<{ data: Note[] }>("/writeups/notes/me", { params: { labId } }).then((r) => r.data),
  createNote: (dto: { title: string; body: string; labId?: string; tags?: string[]; isPinned?: boolean }) =>
    axiosInstance.post<{ data: Note }>("/writeups/notes", dto).then((r) => r.data),
  updateNote: (id: string, dto: unknown) =>
    axiosInstance.patch(`/writeups/notes/${id}`, dto).then((r) => r.data),
  deleteNote: (id: string) =>
    axiosInstance.delete(`/writeups/notes/${id}`).then((r) => r.data),
};

export const mentorshipApi = {
  listMentors: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { items: MentorProfile[]; total: number } }>("/mentorship/mentors", { params }).then((r) => r.data),
  getMentor: (username: string) =>
    axiosInstance.get<{ data: MentorProfile }>(`/mentorship/mentors/${username}`).then((r) => r.data),
  becomeMentor: (dto: { bio?: string; expertise?: string[]; maxStudents?: number }) =>
    axiosInstance.post("/mentorship/become-mentor", dto).then((r) => r.data),
  requestMentorship: (username: string, dto: { message?: string; goals?: string[] }) =>
    axiosInstance.post(`/mentorship/request/${username}`, dto).then((r) => r.data),
  respondToRequest: (id: string, accept: boolean) =>
    axiosInstance.post(`/mentorship/requests/${id}/respond`, { accept }).then((r) => r.data),
  getMyRequests: (role: "mentor" | "student") =>
    axiosInstance.get("/mentorship/requests/me", { params: { role } }).then((r) => r.data),
};

// ─── SecOps — Workflows ───────────────────────────────────────────────
export interface WorkflowNodeDef { id: string; type: string; label?: string; config: Record<string, unknown>; position?: { x: number; y: number } }
export interface WorkflowEdgeDef { id: string; source: string; target: string; label?: string }
export interface WorkflowSummary {
  id: string; name: string; description?: string; status: string; triggerType: string;
  isEnabled: boolean; lastRunAt?: string; lastRunStatus?: string; version: number;
  createdAt: string; updatedAt?: string; _count?: { executions: number };
}
export interface WorkflowExecution {
  id: string; workflowId: string; userId?: string; status: string; triggerType?: string;
  nodeStates: Record<string, unknown>; startedAt: string; completedAt?: string; durationMs?: number; errorMessage?: string;
  logs?: Array<{ id: string; nodeId?: string; level: string; message: string; data?: unknown; createdAt: string }>;
}
export interface ExecutionLogLine { id: string; nodeId?: string; level: string; message: string; data?: unknown; createdAt: string }
export interface FindingSummary {
  id: string; title: string; severity: string; status: string; tags: string[]; target?: string;
  createdAt: string; updatedAt: string; userId?: string; assignedToId?: string;
  user?: { id: string; username: string; avatarUrl: string | null };
  assignedTo?: { id: string; username: string } | null;
  _count?: { comments: number };
}
export interface AlertSummary {
  id: string; title: string; message: string; severity: string; status: string;
  sourceType?: string; createdAt: string; acknowledgedAt?: string; resolvedAt?: string;
  rule?: { name: string } | null;
  deliveries: Array<{ channel: string; status: string }>;
}
export interface AlertRuleSummary {
  id: string; name: string; description?: string; severity: string; isEnabled: boolean;
  conditions: unknown; action: unknown; cooldownMin: number; lastFiredAt?: string; createdAt: string;
}
export interface ReportSummary {
  id: string; title: string; type: string; status: string; generatedAt: string; content?: unknown;
}
export interface ScheduledJobSummary {
  id: string; name: string; type: string; cronExpression: string; timezone: string;
  isEnabled: boolean; lastRunAt?: string; nextRunAt?: string; lastStatus?: string;
  runCount: number; failCount: number;
  workflow?: { id: string; name: string } | null;
}

// Type aliases used by ops components (canonical names are *Summary variants above)
export type Alert = AlertSummary;
export type AlertRule = AlertRuleSummary;
export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type FindingStatus = "OPEN" | "IN_PROGRESS" | "MITIGATED" | "CLOSED" | "ARCHIVED";
export type ScheduledJob = ScheduledJobSummary;

export const workflowsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { items: WorkflowSummary[]; total: number } }>("/workflows", { params }).then(r => r.data),
  create: (dto: { name: string; description?: string; triggerType?: string; nodes?: WorkflowNodeDef[]; edges?: WorkflowEdgeDef[] }) =>
    axiosInstance.post<{ data: WorkflowSummary }>("/workflows", dto).then(r => r.data),
  getById: (id: string) =>
    axiosInstance.get<{ data: WorkflowSummary & { nodes: WorkflowNodeDef[]; edges: WorkflowEdgeDef[] } }>(`/workflows/${id}`).then(r => r.data),
  update: (id: string, dto: unknown) =>
    axiosInstance.patch(`/workflows/${id}`, dto).then(r => r.data),
  delete: (id: string) =>
    axiosInstance.delete(`/workflows/${id}`).then(r => r.data),
  execute: (id: string, input?: Record<string, unknown>) =>
    axiosInstance.post<{ data: WorkflowExecution }>(`/workflows/${id}/execute`, { input }).then(r => r.data),
  clone: (id: string) =>
    axiosInstance.post(`/workflows/${id}/clone`).then(r => r.data),
  getExecutions: (id: string, params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { items: WorkflowExecution[]; total: number } }>(`/workflows/${id}/executions`, { params }).then(r => r.data),
  getExecution: (execId: string) =>
    axiosInstance.get<{ data: WorkflowExecution & { logs: ExecutionLogLine[]; workflow: { name: string } } }>(`/workflows/executions/${execId}`).then(r => r.data),
};

export const findingsApi = {
  list: (params?: { page?: number; limit?: number; severity?: string; status?: string; search?: string }) =>
    axiosInstance.get<{ data: { items: FindingSummary[]; total: number } }>("/findings", { params }).then(r => r.data),
  create: (dto: { title: string; description?: string; severity: string; status?: string; tags?: string[]; target?: string }) =>
    axiosInstance.post("/findings", dto).then(r => r.data),
  getById: (id: string) =>
    axiosInstance.get(`/findings/${id}`).then(r => r.data),
  update: (id: string, dto: unknown) =>
    axiosInstance.patch(`/findings/${id}`, dto).then(r => r.data),
  delete: (id: string) =>
    axiosInstance.delete(`/findings/${id}`).then(r => r.data),
  addComment: (id: string, body: string) =>
    axiosInstance.post(`/findings/${id}/comments`, { body }).then(r => r.data),
  getStats: () =>
    axiosInstance.get("/findings/stats").then(r => r.data),
};

export const reportsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { items: ReportSummary[]; total: number } }>("/reports", { params }).then(r => r.data),
  generate: (dto: { title: string; type: string; config?: unknown }) =>
    axiosInstance.post<{ data: ReportSummary }>("/reports/generate", dto).then(r => r.data),
  getById: (id: string) =>
    axiosInstance.get<{ data: ReportSummary }>(`/reports/${id}`).then(r => r.data),
  getTemplates: () =>
    axiosInstance.get("/reports/templates").then(r => r.data),
};

export const alertsApi = {
  listRules: () =>
    axiosInstance.get<{ data: AlertRuleSummary[] }>("/alert-rules").then(r => r.data),
  createRule: (dto: unknown) =>
    axiosInstance.post("/alert-rules", dto).then(r => r.data),
  updateRule: (id: string, dto: unknown) =>
    axiosInstance.patch(`/alert-rules/${id}`, dto).then(r => r.data),
  deleteRule: (id: string) =>
    axiosInstance.delete(`/alert-rules/${id}`).then(r => r.data),
  listAlerts: (params?: { status?: string; page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { items: AlertSummary[]; total: number } }>("/alerts", { params }).then(r => r.data),
  acknowledge: (id: string) =>
    axiosInstance.patch(`/alerts/${id}/acknowledge`).then(r => r.data),
  resolve: (id: string) =>
    axiosInstance.patch(`/alerts/${id}/resolve`).then(r => r.data),
};

export const schedulerApi = {
  list: () =>
    axiosInstance.get<{ data: ScheduledJobSummary[] }>("/scheduled-jobs").then(r => r.data),
  create: (dto: { name: string; type: string; cronExpression: string; config: Record<string, unknown>; timezone?: string; workflowId?: string }) =>
    axiosInstance.post("/scheduled-jobs", dto).then(r => r.data),
  update: (id: string, dto: { isEnabled?: boolean; cronExpression?: string }) =>
    axiosInstance.patch(`/scheduled-jobs/${id}`, dto).then(r => r.data),
  delete: (id: string) =>
    axiosInstance.delete(`/scheduled-jobs/${id}`).then(r => r.data),
};

// ─── Admin ────────────────────────────────────────────────────────────
export const adminApi = {
  assignRole: (userId: string, role: string) =>
    axiosInstance.post("/roles/assign", { userId, role }).then((r) => r.data),

  removeRole: (userId: string, role: string) =>
    axiosInstance.delete(`/roles/${userId}/${role}`).then((r) => r.data),
};

// ─── Phase 6: Organizations ───────────────────────────────────────────
export const organizationsApi = {
  getMyOrgs: () =>
    axiosInstance.get<{ data: Array<{ organizationId: string; userId: string; role: string; joinedAt: string; organization: { id: string; name: string; slug: string; planTier: string; isActive: boolean; maxMembers: number; maxApiKeys: number; _count?: { members: number }; subscription?: unknown } }> }>("/organizations/me").then((r) => r.data),

  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    axiosInstance.get<{ data: { items: Array<unknown>; total: number; page: number; limit: number } }>("/organizations", { params }).then((r) => r.data),

  getBySlug: (slug: string) =>
    axiosInstance.get(`/organizations/${slug}`).then((r) => r.data),

  create: (dto: { name: string; slug: string; domain?: string; logoUrl?: string }) =>
    axiosInstance.post("/organizations", dto).then((r) => r.data),

  update: (id: string, dto: { name?: string; domain?: string; logoUrl?: string }) =>
    axiosInstance.patch(`/organizations/${id}`, dto).then((r) => r.data),

  listMembers: (id: string) =>
    axiosInstance.get<{ data: Array<{ organizationId: string; userId: string; role: string; joinedAt: string; user?: { id: string; username: string; email: string; avatarUrl: string | null } }> }>(`/organizations/${id}/members`).then((r) => r.data),

  inviteMember: (id: string, dto: { username?: string; email?: string; role?: string }) =>
    axiosInstance.post(`/organizations/${id}/members`, dto).then((r) => r.data),

  updateMemberRole: (id: string, userId: string, role: string) =>
    axiosInstance.patch(`/organizations/${id}/members/${userId}/role`, { role }).then((r) => r.data),

  removeMember: (id: string, userId: string) =>
    axiosInstance.delete(`/organizations/${id}/members/${userId}`).then((r) => r.data),

  getTenantSettings: (id: string) =>
    axiosInstance.get(`/organizations/${id}/settings`).then((r) => r.data),

  updateTenantSettings: (id: string, dto: {
    mfaRequired?: boolean;
    sessionTtlHours?: number;
    dataRetentionDays?: number;
    ssoEnabled?: boolean;
    ssoProvider?: string;
    ipAllowlist?: string[];
    allowedDomains?: string[];
  }) => axiosInstance.patch(`/organizations/${id}/settings`, dto).then((r) => r.data),
};

// ─── Phase 6: Billing ─────────────────────────────────────────────────
export const billingApi = {
  getPlans: () =>
    axiosInstance.get<{ data: Array<{ id: string; tier: string; name: string; maxMembers: number; maxApiKeys: number; priceMonthlyUsd: number; priceYearlyUsd: number; features: string[]; hasAdvancedRbac: boolean; hasObservability: boolean; hasSso: boolean }> }>("/billing/plans").then((r) => r.data),

  getSubscription: (orgId: string) =>
    axiosInstance.get(`/organizations/${orgId}/billing/subscription`).then((r) => r.data),

  createSubscription: (orgId: string, planTier: string) =>
    axiosInstance.post(`/organizations/${orgId}/billing/subscription`, { planTier }).then((r) => r.data),

  cancelSubscription: (orgId: string) =>
    axiosInstance.delete(`/organizations/${orgId}/billing/subscription`).then((r) => r.data),

  getBillingEvents: (orgId: string, params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { items: Array<{ id: string; type: string; metadata: unknown; amountCents: number | null; createdAt: string }>; total: number } }>(`/organizations/${orgId}/billing/events`, { params }).then((r) => r.data),
};

// ─── Phase 6: Feature Flags ───────────────────────────────────────────
export const featureFlagsApi = {
  listFlags: () =>
    axiosInstance.get<{ data: Array<{ id: string; name: string; description: string | null; isEnabled: boolean; rolloutPct: number; environments: string[]; overrides: unknown[]; createdAt: string; updatedAt: string }> }>("/feature-flags").then((r) => r.data),

  createFlag: (dto: { name: string; description?: string; isEnabled?: boolean; rolloutPct?: number; environments?: string[] }) =>
    axiosInstance.post("/feature-flags", dto).then((r) => r.data),

  updateFlag: (name: string, dto: { description?: string; isEnabled?: boolean; rolloutPct?: number }) =>
    axiosInstance.patch(`/feature-flags/${name}`, dto).then((r) => r.data),

  toggleFlag: (name: string) =>
    axiosInstance.post(`/feature-flags/${name}/toggle`).then((r) => r.data),

  deleteFlag: (name: string) =>
    axiosInstance.delete(`/feature-flags/${name}`).then((r) => r.data),

  evaluateFlag: (name: string, orgId?: string) =>
    axiosInstance.get<{ data: { name: string; enabled: boolean } }>(`/feature-flags/evaluate/${name}`, { params: { orgId } }).then((r) => r.data),
};

// ─── Phase 6: API Management ──────────────────────────────────────────
export const apiManagementApi = {
  getUsage: (params?: { orgId?: string; days?: number }) =>
    axiosInstance.get<{ data: { totalRequests: number; errorCount: number; errorRate: number; avgDurationMs: number; byEndpoint: Array<{ endpoint: string; method: string; count: number; avgDurationMs: number }> } }>("/api-management/usage", { params }).then((r) => r.data),

  getDailyUsage: (params?: { orgId?: string; days?: number }) =>
    axiosInstance.get<{ data: Array<{ date: string; count: number; errors: number }> }>("/api-management/usage/daily", { params }).then((r) => r.data),

  getQuota: (apiKeyId: string) =>
    axiosInstance.get(`/api-management/quota/${apiKeyId}`).then((r) => r.data),

  getTopUsers: (orgId: string, days?: number) =>
    axiosInstance.get<{ data: Array<{ user: { id: string; username: string; avatarUrl: string | null }; requestCount: number }> }>("/api-management/top-users", { params: { orgId, days } }).then((r) => r.data),
};

// ─── Phase 6: Observability ───────────────────────────────────────────
export const observabilityApi = {
  getDetailedHealth: () =>
    axiosInstance.get<{ data: { status: string; services: Array<{ service: string; status: string; error?: string }>; checkedAt: string } }>("/health/detailed").then((r) => r.data),
};

// ─── Phase 6: Backup ─────────────────────────────────────────────────
export const backupApi = {
  trigger: (type: "database" | "config" | "full", organizationId?: string) =>
    axiosInstance.post("/backup/trigger", { type, organizationId }).then((r) => r.data),

  listRecords: (params?: { orgId?: string; page?: number; limit?: number }) =>
    axiosInstance.get("/backup/records", { params }).then((r) => r.data),
};
