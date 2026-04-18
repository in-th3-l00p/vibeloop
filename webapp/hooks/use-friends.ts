"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useFriends() {
  const friends = useQuery(api.friends.listFriends);
  const sendRequestMutation = useMutation(api.friends.sendRequest);
  const acceptRequestMutation = useMutation(api.friends.acceptRequest);
  const removeFriendMutation = useMutation(api.friends.removeFriend);

  const onlineCount =
    friends?.filter((f) => f.presence.status !== "offline").length ?? 0;

  function sendRequest(targetUserId: Id<"users">) {
    return sendRequestMutation({ targetUserId });
  }

  function acceptRequest(friendshipId: Id<"friendships">) {
    return acceptRequestMutation({ friendshipId });
  }

  function removeFriend(friendshipId: Id<"friendships">) {
    return removeFriendMutation({ friendshipId });
  }

  return {
    friends: friends ?? [],
    onlineCount,
    totalCount: friends?.length ?? 0,
    isLoading: friends === undefined,
    sendRequest,
    acceptRequest,
    removeFriend,
  };
}
