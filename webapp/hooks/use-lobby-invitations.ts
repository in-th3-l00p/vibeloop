"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useLobbyInvitations() {
  const invitations = useQuery(api.lobbyInvitations.listMyInvitations);
  const sentInvitations = useQuery(api.lobbyInvitations.listSentInvitations);
  const sendMutation = useMutation(api.lobbyInvitations.send);
  const acceptMutation = useMutation(api.lobbyInvitations.accept);
  const declineMutation = useMutation(api.lobbyInvitations.decline);
  const cancelMutation = useMutation(api.lobbyInvitations.cancel);

  const pendingTargetIds = new Set(
    (sentInvitations ?? []).map((inv) => inv.user._id as string),
  );

  function send(lobbyId: Id<"lobbies">, targetUserId: Id<"users">) {
    return sendMutation({ lobbyId, targetUserId });
  }

  function accept(invitationId: Id<"lobbyInvitations">) {
    return acceptMutation({ invitationId });
  }

  function decline(invitationId: Id<"lobbyInvitations">) {
    return declineMutation({ invitationId });
  }

  function cancel(invitationId: Id<"lobbyInvitations">) {
    return cancelMutation({ invitationId });
  }

  function hasPendingInvite(userId: string) {
    return pendingTargetIds.has(userId);
  }

  return {
    invitations: invitations ?? [],
    sentInvitations: sentInvitations ?? [],
    count: invitations?.length ?? 0,
    isLoading: invitations === undefined,
    send,
    accept,
    decline,
    cancel,
    hasPendingInvite,
  };
}
