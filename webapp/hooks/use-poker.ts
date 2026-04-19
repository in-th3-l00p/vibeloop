"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "./use-current-user";
import type { Id } from "@/convex/_generated/dataModel";

export function usePoker(sessionId: Id<"gameSessions"> | null) {
  const { user } = useCurrentUser();
  const [acting, setActing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const state = useQuery(
    api.poker.queries.getPokerState,
    sessionId ? { sessionId } : "skip",
  );

  const actionMutation = useMutation(api.poker.mutations.playerAction);
  const nextHandMutation = useMutation(api.poker.mutations.startNextHand);
  const leaveMutation = useMutation(api.poker.mutations.leavePokerGame);
  const rejoinMutation = useMutation(api.poker.mutations.rejoinPokerGame);
  const toggleReadyMutation = useMutation(api.poker.mutations.toggleReady);
  const closeGameMutation = useMutation(api.poker.mutations.closePokerGame);
  const initMutation = useMutation(api.poker.mutations.initializePokerGame);

  const guard = useCallback(
    async (fn: () => Promise<unknown>) => {
      if (acting) return;
      setActing(true);
      setLastError(null);
      try {
        await fn();
      } catch (err: any) {
        const msg = err?.message ?? err?.data ?? "Action failed";
        setLastError(msg);
      } finally {
        setActing(false);
      }
    },
    [acting],
  );

  const myPlayer = state?.players.find((p) => p.userId === user?._id);
  const isMyTurn =
    myPlayer !== undefined &&
    state?.currentPlayerIndex === myPlayer.seatIndex &&
    !myPlayer.folded &&
    !myPlayer.allIn &&
    !myPlayer.eliminated &&
    state?.phase !== "showdown" &&
    state?.phase !== "handComplete";

  const highestBet = state
    ? Math.max(0, ...state.players.map((p) => p.currentBet))
    : 0;
  const callAmount = myPlayer ? highestBet - myPlayer.currentBet : 0;
  const canCheck = callAmount === 0;
  const minRaise = state?.minRaise ?? 0;

  const totalPot = state
    ? state.pots.reduce((sum, p) => sum + p.amount, 0) +
      state.players.reduce((sum, p) => sum + p.currentBet, 0)
    : 0;

  const readyCount = state
    ? state.players.filter(
        (p) => !p.eliminated && p.readyForNext,
      ).length
    : 0;

  const activePlayers = state
    ? state.players.filter((p) => !p.eliminated && !p.sittingOut)
    : [];

  return {
    state,
    isLoading: state === undefined && sessionId !== null,
    myPlayer,
    isMyTurn,
    canCheck,
    callAmount,
    minRaise,
    totalPot,
    highestBet,
    readyCount,
    activePlayerCount: activePlayers.length,
    isReady: myPlayer?.readyForNext ?? false,
    isSittingOut: myPlayer?.sittingOut ?? false,
    acting,
    lastError,
    clearError: () => setLastError(null),
    initialize: (sid: Id<"gameSessions">) =>
      guard(() => initMutation({ sessionId: sid })),
    fold: () =>
      guard(() => sessionId ? actionMutation({ sessionId, action: "fold" }) : Promise.resolve()),
    check: () =>
      guard(() => sessionId ? actionMutation({ sessionId, action: "check" }) : Promise.resolve()),
    call: () =>
      guard(() => sessionId ? actionMutation({ sessionId, action: "call" }) : Promise.resolve()),
    raise: (amount: number) =>
      guard(() => sessionId ? actionMutation({ sessionId, action: "raise", amount }) : Promise.resolve()),
    nextHand: () =>
      guard(() => sessionId ? nextHandMutation({ sessionId }) : Promise.resolve()),
    leave: () =>
      guard(() => sessionId ? leaveMutation({ sessionId }) : Promise.resolve()),
    rejoin: () =>
      guard(() => sessionId ? rejoinMutation({ sessionId }) : Promise.resolve()),
    toggleReady: () =>
      guard(() => sessionId ? toggleReadyMutation({ sessionId }) : Promise.resolve()),
    closeGame: () =>
      guard(() => sessionId ? closeGameMutation({ sessionId }) : Promise.resolve()),
  };
}
