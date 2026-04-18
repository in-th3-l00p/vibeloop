"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export type Relationship =
  | { kind: "self" }
  | { kind: "none" }
  | { kind: "friends"; friendshipId: Id<"friendships"> }
  | { kind: "pending"; friendshipId: Id<"friendships">; direction: "outgoing" | "incoming" }
  | { kind: "blocked"; friendshipId: Id<"friendships"> }
  | null; // loading

export function useRelationship(targetUserId: Id<"users"> | null) {
  const relationship = useQuery(
    api.friends.getRelationship,
    targetUserId ? { targetUserId } : "skip",
  );
  const sendRequestMutation = useMutation(api.friends.sendRequest);
  const acceptRequestMutation = useMutation(api.friends.acceptRequest);
  const declineRequestMutation = useMutation(api.friends.declineRequest);
  const cancelRequestMutation = useMutation(api.friends.cancelRequest);
  const removeFriendMutation = useMutation(api.friends.removeFriend);

  function sendRequest() {
    if (!targetUserId) return;
    return sendRequestMutation({ targetUserId });
  }

  function acceptRequest(friendshipId: Id<"friendships">) {
    return acceptRequestMutation({ friendshipId });
  }

  function declineRequest(friendshipId: Id<"friendships">) {
    return declineRequestMutation({ friendshipId });
  }

  function cancelRequest(friendshipId: Id<"friendships">) {
    return cancelRequestMutation({ friendshipId });
  }

  function removeFriend(friendshipId: Id<"friendships">) {
    return removeFriendMutation({ friendshipId });
  }

  return {
    relationship: (relationship ?? null) as Relationship,
    isLoading: targetUserId !== null && relationship === undefined,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  };
}
