"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePoker } from "@/hooks/use-poker";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PokerCard } from "./components/poker-card";
import { PlayerSeat } from "./components/player-seat";
import { ActionBar } from "./components/action-bar";
import { PotDisplay } from "./components/pot-display";
import type { Id } from "@/convex/_generated/dataModel";

export default function PokerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session") as Id<"gameSessions"> | null;
  const { user: currentUser } = useCurrentUser();

  const {
    state,
    isLoading,
    myPlayer,
    isMyTurn,
    canCheck,
    callAmount,
    minRaise,
    totalPot,
    fold,
    check,
    call,
    raise,
    nextHand,
    leave,
  } = usePoker(sessionId);

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">No session specified</p>
        <Link
          href="/dashboard"
          className="text-sm text-primary hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading poker table...</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Game not found or has ended</p>
        <Link
          href="/dashboard"
          className="text-sm text-primary hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const activePlayers = state.players.filter((p) => !p.eliminated);
  const maxRaise = myPlayer ? myPlayer.chips - callAmount : 0;

  const phaseLabel: Record<string, string> = {
    preflop: "Pre-Flop",
    flop: "Flop",
    turn: "Turn",
    river: "River",
    showdown: "Showdown",
    handComplete: "Hand Complete",
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-2xl mx-auto px-4 py-6 gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-card ring-1 ring-border p-2 transition-all hover:ring-white/20"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          </Link>
          <div>
            <p className="text-sm font-bold text-foreground flex items-center gap-2">
              ♠ Texas Hold&apos;em
              <span className="text-[10px] text-muted-foreground font-normal">
                Hand #{state.handNumber}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {phaseLabel[state.phase] ?? state.phase}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {myPlayer && (
            <div className="bg-card ring-1 ring-border rounded-lg px-3 py-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                Your Chips
              </p>
              <p className="text-sm font-bold font-mono text-foreground">
                {myPlayer.chips.toLocaleString()}
              </p>
            </div>
          )}
          <button
            onClick={async () => {
              await leave();
              router.push("/dashboard");
            }}
            className="cursor-pointer text-[10px] uppercase tracking-wider text-red-400 rounded-lg px-3 py-2 bg-red-500/10 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Players top row */}
        <div className="flex items-end justify-center gap-6 flex-wrap">
          {activePlayers
            .filter((_, i) => i >= Math.ceil(activePlayers.length / 2))
            .map((p) => (
              <PlayerSeat
                key={p.userId}
                username={p.userId === currentUser?._id ? "You" : `Seat ${p.seatIndex + 1}`}
                chips={p.chips}
                holeCards={p.holeCards}
                currentBet={p.currentBet}
                folded={p.folded}
                allIn={p.allIn}
                eliminated={p.eliminated}
                isDealer={p.seatIndex === state.dealerIndex}
                isCurrentTurn={state.currentPlayerIndex === p.seatIndex}
                isSelf={p.userId === currentUser?._id}
                accent="#16a34a"
              />
            ))}
        </div>

        {/* Table felt */}
        <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-emerald-900/80 to-emerald-950/80 ring-2 ring-emerald-700/30 shadow-[0_0_40px_rgba(16,185,129,0.1)] px-8 py-10 flex flex-col items-center gap-4">
          {/* Pot */}
          <PotDisplay totalPot={totalPot} pots={state.pots} />

          {/* Community cards */}
          <div className="flex items-center gap-2 min-h-[80px]">
            <AnimatePresence>
              {state.communityCards.map((card, i) => (
                <PokerCard key={`${card}-${i}`} card={card} size="md" delay={i * 0.15} />
              ))}
            </AnimatePresence>
            {/* Placeholder slots */}
            {Array.from({ length: 5 - state.communityCards.length }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-14 h-20 rounded-lg border border-dashed border-emerald-700/30"
                />
              ),
            )}
          </div>

          {/* Last action */}
          {state.lastAction && (
            <motion.p
              key={`${state.lastAction.userId}-${state.lastAction.action}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-emerald-400/70 uppercase tracking-wider"
            >
              Last: {state.lastAction.action}
              {state.lastAction.amount
                ? ` ${state.lastAction.amount}`
                : ""}
            </motion.p>
          )}
        </div>

        {/* Players bottom row */}
        <div className="flex items-start justify-center gap-6 flex-wrap">
          {activePlayers
            .filter((_, i) => i < Math.ceil(activePlayers.length / 2))
            .map((p) => (
              <PlayerSeat
                key={p.userId}
                username={p.userId === currentUser?._id ? "You" : `Seat ${p.seatIndex + 1}`}
                chips={p.chips}
                holeCards={p.holeCards}
                currentBet={p.currentBet}
                folded={p.folded}
                allIn={p.allIn}
                eliminated={p.eliminated}
                isDealer={p.seatIndex === state.dealerIndex}
                isCurrentTurn={state.currentPlayerIndex === p.seatIndex}
                isSelf={p.userId === currentUser?._id}
                accent="#16a34a"
              />
            ))}
        </div>
      </div>

      {/* Winners overlay */}
      <AnimatePresence>
        {state.phase === "handComplete" && state.winnersLastHand && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-card ring-1 ring-border rounded-xl p-4 space-y-3"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground text-center">
              Hand Result
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {state.winnersLastHand.map((w, i) => (
                <div
                  key={i}
                  className="bg-emerald-500/10 ring-1 ring-emerald-500/30 rounded-lg px-4 py-2 text-center"
                >
                  <p className="text-sm font-bold text-emerald-400">
                    +{w.amount}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {w.handName}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button
                onClick={nextHand}
                className="cursor-pointer rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-400 px-6 py-2.5 text-sm font-medium transition-all hover:bg-emerald-500/20"
              >
                Next Hand
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action bar */}
      {state.phase !== "handComplete" && state.phase !== "showdown" && myPlayer && !myPlayer.eliminated && (
        <ActionBar
          isMyTurn={isMyTurn}
          canCheck={canCheck}
          callAmount={callAmount}
          minRaise={minRaise}
          maxRaise={maxRaise > 0 ? maxRaise : 0}
          onFold={fold}
          onCheck={check}
          onCall={call}
          onRaise={raise}
        />
      )}
    </div>
  );
}
