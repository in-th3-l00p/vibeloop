"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useLobby() {
  const myLobby = useQuery(api.lobbies.getMyLobby);
  const openLobbies = useQuery(api.lobbies.listOpen);
  const createMutation = useMutation(api.lobbies.create);
  const joinMutation = useMutation(api.lobbies.join);
  const leaveMutation = useMutation(api.lobbies.leave);

  function create(name: string, maxPlayers: number) {
    return createMutation({ name, maxPlayers });
  }

  function join(lobbyId: Id<"lobbies">) {
    return joinMutation({ lobbyId });
  }

  function leave(lobbyId: Id<"lobbies">) {
    return leaveMutation({ lobbyId });
  }

  return {
    myLobby: myLobby ?? null,
    openLobbies: openLobbies ?? [],
    isLoading: myLobby === undefined,
    create,
    join,
    leave,
  };
}
