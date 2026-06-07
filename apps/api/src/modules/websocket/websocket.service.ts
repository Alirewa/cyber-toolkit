import { Injectable } from "@nestjs/common";
import { WebsocketGateway } from "./websocket.gateway";

@Injectable()
export class WebsocketService {
  constructor(private readonly gateway: WebsocketGateway) {}

  notifyUser(userId: string, notification: { id: string; type: string; title: string; message: string }): void {
    this.gateway.emitToUser(userId, "notification:new", notification);
  }

  revokeUserSession(userId: string, sessionId: string): void {
    this.gateway.emitToUser(userId, "session:revoked", { sessionId });
  }

  broadcast(event: string, data: unknown): void {
    this.gateway.emitToAll(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.gateway.isUserOnline(userId);
  }

  // ── Tool execution events ────────────────────────────────────────
  emitToolStarted(userId: string, payload: { runId: string; toolSlug: string; toolName: string }): void {
    this.gateway.emitToUser(userId, "tool:started", payload);
  }

  emitToolProgress(userId: string, payload: { runId: string; step: string; percent: number }): void {
    this.gateway.emitToUser(userId, "tool:progress", payload);
  }

  emitToolCompleted(userId: string, payload: { runId: string; result: unknown; executionMs: number }): void {
    this.gateway.emitToUser(userId, "tool:completed", payload);
  }

  emitToolFailed(userId: string, payload: { runId: string; error: string }): void {
    this.gateway.emitToUser(userId, "tool:failed", payload);
  }

  // ── Lab events ───────────────────────────────────────────────
  emitLabSessionStarted(userId: string, payload: { sessionId: string; labSlug: string; sandboxUrl?: string | null }): void {
    this.gateway.emitToUser(userId, "lab:session:started", payload);
  }

  emitLabSessionExpired(userId: string, payload: { sessionId: string; labSlug: string }): void {
    this.gateway.emitToUser(userId, "lab:session:expired", payload);
  }

  emitLabSubmissionResult(
    userId: string,
    payload: { submissionId: string; passed: boolean; score: number; maxScore: number; xpEarned: number },
  ): void {
    this.gateway.emitToUser(userId, "lab:submission:result", payload);
  }

  emitAchievementUnlocked(
    userId: string,
    payload: { achievement: { slug: string; name: string; icon: string; xpReward: number } },
  ): void {
    this.gateway.emitToUser(userId, "achievement:unlocked", payload);
  }

  emitXpGained(
    userId: string,
    payload: { xpGained: number; totalXp: number; level: number; leveledUp: boolean },
  ): void {
    this.gateway.emitToUser(userId, "xp:gained", payload);
  }

  // ── Community events ─────────────────────────────────────────
  emitNewFollower(userId: string, payload: { followerUsername: string; followerAvatar?: string | null }): void {
    this.gateway.emitToUser(userId, "community:new_follower", payload);
  }

  emitNewDiscussionReply(userId: string, payload: { discussionId: string; discussionTitle: string; authorUsername: string }): void {
    this.gateway.emitToUser(userId, "community:discussion_reply", payload);
  }

  emitMentorshipRequest(userId: string, payload: { requestId: string; studentUsername: string }): void {
    this.gateway.emitToUser(userId, "community:mentorship_request", payload);
  }

  emitTeamInvitation(userId: string, payload: { invitationId: string; teamName: string; teamSlug: string }): void {
    this.gateway.emitToUser(userId, "community:team_invitation", payload);
  }

  emitReputationUpdate(userId: string, payload: { gained: number; total: number; tier: string }): void {
    this.gateway.emitToUser(userId, "community:reputation_update", payload);
  }

  emitLeaderboardUpdate(payload: { top10: unknown[] }): void {
    this.gateway.emitToAll("community:leaderboard_update", payload);
  }

  // ── Phase 5 — SecOps / Workflow events ──────────────────────
  emitWorkflowStepCompleted(userId: string, payload: { executionId: string; nodeId: string; nodeType: string; success: boolean }): void {
    this.gateway.emitToUser(userId, "workflow:step-completed", payload);
  }

  emitWorkflowCompleted(userId: string, payload: { executionId: string; workflowName: string; durationMs: number }): void {
    this.gateway.emitToUser(userId, "workflow:completed", payload);
  }

  emitWorkflowFailed(userId: string, payload: { executionId: string; workflowName: string; error: string }): void {
    this.gateway.emitToUser(userId, "workflow:failed", payload);
  }

  emitScheduledJobFired(userId: string, payload: { jobName: string; type: string }): void {
    this.gateway.emitToUser(userId, "scheduler:job-fired", payload);
  }

  emitAlertTriggered(userId: string, payload: { alertId: string; title: string; severity: string }): void {
    this.gateway.emitToUser(userId, "alert:triggered", payload);
  }

  emitFindingCreated(userId: string, payload: { findingId: string; title: string; severity: string }): void {
    this.gateway.emitToUser(userId, "finding:created", payload);
  }
}
