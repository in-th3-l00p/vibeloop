"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useLobbyChat(lobbyId: Id<"lobbies"> | null) {
  const messages = useQuery(
    api.chat.list,
    lobbyId ? { lobbyId } : "skip",
  );
  const sendMutation = useMutation(api.chat.send);

  function send(text: string) {
    if (!lobbyId) return;
    return sendMutation({ lobbyId, text });
  }

  return {
    messages: messages ?? [],
    isLoading: messages === undefined,
    send,
  };
}
