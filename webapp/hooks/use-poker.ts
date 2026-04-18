"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "./use-current-user";
import type { Id } from "@/convex/_generated/dataModel";

export function usePoker(sessionId: Id<"gameSessions"> | null) {
  const { user } = useCurrentUser();

  const state = useQuery(
    api.poker.queries.getPokerState,
    sessionId ? { sessionId } : "skip",
  );

  const actionMutation = useMutation(api.poker.mutations.playerAction);
  const nextHandMutation = useMutation(api.poker.mutations.startNextHand);
  const leaveMutation = useMutation(api.poker.mutations.leavePokerGame);
  const initMutation = useMutation(api.poker.mutations.initializePokerGame);

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
    initialize: (sid: Id<"gameSessions">) =>
      initMutation({ sessionId: sid }),
    fold: () =>
      sessionId && actionMutation({ sessionId, action: "fold" }),
    check: () =>
      sessionId && actionMutation({ sessionId, action: "check" }),
    call: () =>
      sessionId && actionMutation({ sessionId, action: "call" }),
    raise: (amount: number) =>
      sessionId &&
      actionMutation({ sessionId, action: "raise", amount }),
    nextHand: () =>
      sessionId && nextHandMutation({ sessionId }),
    leave: () =>
      sessionId && leaveMutation({ sessionId }),
  };
}
