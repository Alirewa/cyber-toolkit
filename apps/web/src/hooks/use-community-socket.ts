"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/socket-provider";
import { queryKeys } from "@/lib/query-keys";

interface NewFollowerPayload   { followerUsername: string; followerAvatar?: string | null }
interface DiscussionReplyPayload { discussionId: string; discussionTitle: string; authorUsername: string }
interface MentorshipRequestPayload { requestId: string; studentUsername: string }
interface TeamInvitationPayload { invitationId: string; teamName: string; teamSlug: string }
interface ReputationUpdatePayload { gained: number; total: number; tier: string }

export function useCommunitySocket() {
  const { socket } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    socket.on("community:new_follower", (p: NewFollowerPayload) => {
      toast.success(`@${p.followerUsername} started following you! 👋`);
      void qc.invalidateQueries({ queryKey: queryKeys.community.myProfile });
    });

    socket.on("community:discussion_reply", (p: DiscussionReplyPayload) => {
      toast.info(`@${p.authorUsername} replied to your discussion`, {
        description: p.discussionTitle,
        action: {
          label: "View",
          onClick: () => (window.location.href = `/dashboard/community/discussions/${p.discussionId}`),
        },
      });
      void qc.invalidateQueries({ queryKey: queryKeys.discussions.byId(p.discussionId) });
    });

    socket.on("community:mentorship_request", (p: MentorshipRequestPayload) => {
      toast.success(`@${p.studentUsername} requested mentorship 🎓`, {
        action: {
          label: "View",
          onClick: () => (window.location.href = "/dashboard/community/mentorship"),
        },
      });
      void qc.invalidateQueries({ queryKey: queryKeys.mentorship.myRequests("mentor") });
    });

    socket.on("community:team_invitation", (p: TeamInvitationPayload) => {
      toast.success(`You've been invited to join "${p.teamName}" 🤝`, {
        action: {
          label: "View",
          onClick: () => (window.location.href = `/dashboard/community/teams/${p.teamSlug}`),
        },
      });
      void qc.invalidateQueries({ queryKey: queryKeys.teams.myInvitations });
    });

    socket.on("community:reputation_update", (p: ReputationUpdatePayload) => {
      toast.success(`+${p.gained} reputation earned! Now: ${p.total} (${p.tier}) 🛡️`);
      void qc.invalidateQueries({ queryKey: queryKeys.community.leaderboard });
      void qc.invalidateQueries({ queryKey: queryKeys.community.myProfile });
    });

    socket.on("community:leaderboard_update", () => {
      void qc.invalidateQueries({ queryKey: queryKeys.community.leaderboard });
    });

    return () => {
      socket.off("community:new_follower");
      socket.off("community:discussion_reply");
      socket.off("community:mentorship_request");
      socket.off("community:team_invitation");
      socket.off("community:reputation_update");
      socket.off("community:leaderboard_update");
    };
  }, [socket, qc]);
}
