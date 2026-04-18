"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "./use-current-user";
import { Id } from "@/convex/_generated/dataModel";

export function useLobby() {
  const { isAuthenticated } = useConvexAuth();
  const { user: currentUser } = useCurrentUser();
  const myLobby = useQuery(api.lobbies.getMyLobby);
  const openLobbies = useQuery(api.lobbies.listOpen);
  const getOrCreateMutation = useMutation(api.lobbies.getOrCreateMyLobby);
  const createMutation = useMutation(api.lobbies.create);
  const joinMutation = useMutation(api.lobbies.join);
  const leaveMutation = useMutation(api.lobbies.leave);
  const kickMutation = useMutation(api.lobbies.kick);
  const renameMutation = useMutation(api.lobbies.rename);
  const transferHostMutation = useMutation(api.lobbies.transferHost);

  // Auto-create lobby if user doesn't have one
  useEffect(() => {
    if (isAuthenticated && myLobby === null) {
      getOrCreateMutation();
    }
  }, [isAuthenticated, myLobby, getOrCreateMutation]);

  const isHost = !!(currentUser && myLobby?.lobby && myLobby.lobby.hostId === currentUser._id);

  const memberCount = myLobby?.members.length ?? 0;
  const isSolo = memberCount <= 1;

  function createNew(name?: string) {
    return createMutation({
      name: name ?? "New Lobby",
      maxPlayers: 20,
    });
  }

  function join(lobbyId: Id<"lobbies">) {
    return joinMutation({ lobbyId });
  }

  function leave() {
    if (!myLobby?.lobby) return;
    return leaveMutation({ lobbyId: myLobby.lobby._id });
  }

  function kick(targetUserId: Id<"users">) {
    if (!myLobby?.lobby) return;
    return kickMutation({ lobbyId: myLobby.lobby._id, targetUserId });
  }

  function rename(name: string) {
    if (!myLobby?.lobby) return;
    return renameMutation({ lobbyId: myLobby.lobby._id, name });
  }

  function transferHost(targetUserId: Id<"users">) {
    if (!myLobby?.lobby) return;
    return transferHostMutation({ lobbyId: myLobby.lobby._id, targetUserId });
  }

  return {
    myLobby: myLobby ?? null,
    lobbyId: myLobby?.lobby?._id ?? null,
    openLobbies: openLobbies ?? [],
    isLoading: myLobby === undefined,
    isHost,
    isSolo,
    memberCount,
    createNew,
    join,
    leave,
    kick,
    rename,
    transferHost,
  };
}
