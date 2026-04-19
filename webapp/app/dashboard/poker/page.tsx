"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePoker } from "@/hooks/use-poker";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEvents } from "@/hooks/use-events";
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
    rejoin,
    toggleReady,
    closeGame,
    isSittingOut,
    isReady,
    readyCount,
  } = usePoker(sessionId);

  const mySession = useQuery(api.sessions.getMySession);
  const isHost = mySession?.session?.createdBy === currentUser?._id;

  // Redirect to dashboard when a gameEnded event arrives
  const { events, dismiss } = useEvents();
  useEffect(() => {
    const endEvent = events.find((e) => e.type === "gameEnded");
    if (endEvent) {
      dismiss(endEvent._id);
      router.push("/dashboard");
    }
  }, [events, dismiss, router]);

  // Countdown timer
  const countdownStartedAt = state?.countdownStartedAt;
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!countdownStartedAt) {
      setCountdown(null);
      return;
    }
    const tick = () => {
      const elapsed = (Date.now() - countdownStartedAt) / 1000;
      const remaining = Math.max(0, 5 - elapsed);
      setCountdown(Math.ceil(remaining));
    };
    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [countdownStartedAt]);

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

  if (isLoading || !state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading poker table...</p>
        {state === null && (
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            Back to Dashboard
          </Link>
        )}
      </div>
    );
  }

  const activePlayers = state.players.filter((p) => !p.eliminated);
  const playablePlayers = activePlayers.filter((p) => !p.sittingOut);
  const canStartNextHand = playablePlayers.length >= 2;
  const isHandInProgress = state.phase !== "handComplete" && state.phase !== "showdown";
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
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-6xl w-full mx-auto px-6 py-6 gap-4">
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
          {isSittingOut ? (
            <button
              onClick={async () => {
                await rejoin();
              }}
              className="cursor-pointer text-[10px] uppercase tracking-wider text-emerald-400 rounded-lg px-3 py-2 bg-emerald-500/10 ring-1 ring-emerald-500/30 transition-all hover:bg-emerald-500/20"
            >
              Rejoin
            </button>
          ) : (
            <button
              disabled={isHandInProgress}
              onClick={async () => {
                await leave();
              }}
              className="cursor-pointer text-[10px] uppercase tracking-wider text-red-400 rounded-lg px-3 py-2 bg-red-500/10 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
              title={isHandInProgress ? "Wait for the hand to finish" : undefined}
            >
              Sit Out
            </button>
          )}
          {isHost && !isHandInProgress && (
            <button
              onClick={async () => {
                await closeGame();
                router.push("/dashboard");
              }}
              className="cursor-pointer text-[10px] uppercase tracking-wider text-red-400 rounded-lg px-3 py-2 bg-red-500/10 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20"
            >
              End Game
            </button>
          )}
        </div>
      </div>

      {/* Sitting out banner */}
      {isSittingOut && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 px-4 py-3 flex items-center justify-between max-w-4xl w-full mx-auto"
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">You are sitting out</span>
            <span className="text-[10px] text-muted-foreground">Your hand is folded. You&apos;ll be dealt back in when you rejoin.</span>
          </div>
          <button
            onClick={rejoin}
            className="cursor-pointer text-[10px] uppercase tracking-wider text-emerald-400 rounded-lg px-3 py-2 bg-emerald-500/10 ring-1 ring-emerald-500/30 transition-all hover:bg-emerald-500/20"
          >
            Rejoin Game
          </button>
        </motion.div>
      )}

      {/* Table */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Players top row */}
        <div className="flex items-end justify-center gap-10 flex-wrap">
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
                sittingOut={p.sittingOut}
                readyForNext={p.readyForNext}
                isHandComplete={state.phase === "handComplete"}
                isDealer={p.seatIndex === state.dealerIndex}
                isCurrentTurn={state.currentPlayerIndex === p.seatIndex}
                isSelf={p.userId === currentUser?._id}
                accent="#16a34a"
              />
            ))}
        </div>

        {/* Table felt */}
        <div className="relative w-full max-w-4xl rounded-3xl bg-gradient-to-br from-emerald-900/80 to-emerald-950/80 ring-2 ring-emerald-700/30 shadow-[0_0_40px_rgba(16,185,129,0.1)] px-12 py-14 flex flex-col items-center gap-5">
          {/* Pot */}
          <PotDisplay totalPot={totalPot} pots={state.pots} />

          {/* Community cards */}
          <div className="flex items-center gap-3 min-h-[80px]">
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
        <div className="flex items-start justify-center gap-10 flex-wrap">
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
                sittingOut={p.sittingOut}
                readyForNext={p.readyForNext}
                isHandComplete={state.phase === "handComplete"}
                isDealer={p.seatIndex === state.dealerIndex}
                isCurrentTurn={state.currentPlayerIndex === p.seatIndex}
                isSelf={p.userId === currentUser?._id}
                accent="#16a34a"
              />
            ))}
        </div>
      </div>

      {/* Hand complete: results + ready system */}
      <AnimatePresence>
        {state.phase === "handComplete" && state.winnersLastHand && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-card ring-1 ring-border rounded-xl px-4 py-3 max-w-4xl w-full mx-auto"
          >
            {/* Result + Ready in a compact row layout */}
            <div className="flex items-center justify-between gap-4">
              {/* Left: hand result */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Result</span>
                {state.winnersLastHand.map((w, i) => (
                  <span key={i} className="text-sm font-bold text-emerald-400">
                    +{w.amount}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">{w.handName}</span>
                  </span>
                ))}
              </div>

              {/* Center: countdown or ready dots */}
              <div className="flex items-center gap-2">
                {countdown !== null && countdown > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-xl font-bold font-mono text-emerald-400">{countdown}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">sec</span>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {readyCount}/{activePlayers.filter((p) => !p.eliminated).length}
                    </span>
                    <div className="flex gap-1">
                      {activePlayers
                        .filter((p) => !p.eliminated)
                        .map((p) => (
                          <div
                            key={p.userId}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              p.readyForNext
                                ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]"
                                : "bg-muted-foreground/30"
                            }`}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-2">
                {myPlayer && !myPlayer.eliminated && (
                  <button
                    onClick={toggleReady}
                    className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                      isReady
                        ? "bg-emerald-500/20 ring-1 ring-emerald-500/40 text-emerald-400"
                        : "bg-card ring-1 ring-border text-muted-foreground hover:text-foreground hover:ring-white/20"
                    }`}
                  >
                    {isReady ? "Ready ✓" : "Ready Up"}
                  </button>
                )}
                {isHost && (
                  <button
                    disabled={readyCount < 2}
                    onClick={nextHand}
                    className="cursor-pointer rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-400 px-4 py-1.5 text-xs font-medium transition-all hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {countdown ? "Skip" : readyCount < 2 ? "Start (2+)" : "Start"}
                  </button>
                )}
              </div>
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
