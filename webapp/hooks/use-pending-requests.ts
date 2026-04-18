"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function usePendingRequests() {
  const requests = useQuery(api.friends.listPendingRequests);
  const acceptMutation = useMutation(api.friends.acceptRequest);
  const declineMutation = useMutation(api.friends.declineRequest);
  const cancelMutation = useMutation(api.friends.cancelRequest);

  const incoming = requests?.filter((r) => r.direction === "incoming") ?? [];
  const outgoing = requests?.filter((r) => r.direction === "outgoing") ?? [];

  function accept(friendshipId: Id<"friendships">) {
    return acceptMutation({ friendshipId });
  }

  function decline(friendshipId: Id<"friendships">) {
    return declineMutation({ friendshipId });
  }

  function cancel(friendshipId: Id<"friendships">) {
    return cancelMutation({ friendshipId });
  }

  return {
    requests: requests ?? [],
    incoming,
    outgoing,
    count: requests?.length ?? 0,
    incomingCount: incoming.length,
    isLoading: requests === undefined,
    accept,
    decline,
    cancel,
  };
}
