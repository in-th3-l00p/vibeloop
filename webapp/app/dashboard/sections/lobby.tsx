"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatIcon, Add01Icon, Crown02Icon, UserIcon, UserRemove01Icon } from "@hugeicons/core-free-icons";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "../dashboard-context";
import { useLobby } from "@/hooks/use-lobby";
import { useLobbyChat } from "@/hooks/use-lobby-chat";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEvents } from "@/hooks/use-events";
import { ScrollRow } from "../components/ui/scroll-row";
import { StatusDot, StatusLabel } from "../components/ui/status-indicator";
import { InviteDialog } from "../components/invite-dialog";
import { PlayerDialog } from "../components/player-dialog";
import { LobbySkeleton } from "../components/ui/skeleton-primitives";
import { getProfileCardById } from "../lib/theme-utils";
import type { Player } from "../types";
import type { Id } from "@/convex/_generated/dataModel";

interface SelectedPlayer {
  player: Player;
  userId?: Id<"users">;
}

export function Lobby() {
  const { settings } = useDashboard();
  const { compactMode, glowEffects } = settings;
  const cardW = compactMode ? "w-32" : "w-40";
  const [selected, setSelected] = useState<SelectedPlayer | null>(null);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [kickTarget, setKickTarget] = useState<{ userId: Id<"users">; name: string } | null>(null);
  const router = useRouter();

  const { user: currentUser } = useCurrentUser();
  const activeSession = useQuery(api.sessions.getMySession);
  const pokerSummary = useQuery(
    api.poker.queries.getPokerSummary,
    activeSession?.session?.status === "playing" && activeSession.session.gameName === "Texas Hold'em"
      ? { sessionId: activeSession.session._id }
      : "skip",
  );

  const closePokerGame = useMutation(api.poker.mutations.closePokerGame);
  const { myLobby, lobbyId, isLoading, isHost, isSolo, createNew, rename, kick, transferHost } = useLobby();

  const hasPlayingSession = activeSession?.session?.status === "playing";
  const canLeaveGame =
    activeSession?.session?.gameName === "Texas Hold'em" &&
    pokerSummary &&
    (pokerSummary.isSittingOut || pokerSummary.isEliminated);
  const isLockedInGame = hasPlayingSession && !canLeaveGame;
  const canHostEndGame =
    isHost &&
    hasPlayingSession &&
    activeSession?.session?.gameName === "Texas Hold'em" &&
    pokerSummary &&
    pokerSummary.phase === "handComplete";
  const { messages: liveMessages, send } = useLobbyChat(lobbyId);
  const [chatInput, setChatInput] = useState("");

  const players = myLobby
    ? myLobby.members.map((m) => ({
        name: m.user.username,
        tag: m.user.tag,
        accent: m.user.accent,
        bio: m.user.bio,
        status: m.membership.role === "host" ? "ready" : "idle",
        banner: m.user.banner,
        userId: m.user._id as Id<"users">,
        cardTheme: m.user.cardTheme as string,
        isHost: m.membership.role === "host",
      }))
    : [];

  const chatMessages = liveMessages.map((m) => ({
    from: m.username,
    accent: m.accent,
    text: m.text,
    time: new Date(m._creationTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
  }));

  function handleSend() {
    const text = chatInput.trim();
    if (!text) return;
    send(text);
    setChatInput("");
  }

  const [newLobbyName, setNewLobbyName] = useState("");

  function handleNewLobby() {
    setConfirmNewOpen(false);
    createNew(newLobbyName.trim() || undefined);
    setNewLobbyName("");
  }

  // Event-driven game launch dialog
  const LAUNCH_DURATION = 5;
  const { events, dismiss } = useEvents();
  const [launchEvent, setLaunchEvent] = useState<{
    eventId: string;
    gameName: string;
    sessionId: string;
    startedAt: number;
  } | null>(null);
  const [launchCountdown, setLaunchCountdown] = useState(LAUNCH_DURATION);

  useEffect(() => {
    if (launchEvent) return;
    const gameStarted = events.find((e) => e.type === "gameStarted");
    if (!gameStarted) return;

    const startedAt: number = gameStarted.payload?.startedAt ?? Date.now();
    const elapsed = (Date.now() - startedAt) / 1000;

    if (elapsed >= LAUNCH_DURATION) {
      // Timer already expired — dismiss and redirect instantly
      dismiss(gameStarted._id);
      const route =
        (gameStarted.payload?.gameName ?? "") === "Texas Hold'em"
          ? `/dashboard/poker?session=${gameStarted.payload?.sessionId}`
          : `/dashboard`;
      router.push(route);
      return;
    }

    setLaunchEvent({
      eventId: gameStarted._id,
      gameName: gameStarted.payload?.gameName ?? "Game",
      sessionId: gameStarted.payload?.sessionId ?? "",
      startedAt,
    });
    setLaunchCountdown(Math.ceil(LAUNCH_DURATION - elapsed));
  }, [events, launchEvent, dismiss, router]);

  useEffect(() => {
    if (!launchEvent) return;

    const tick = () => {
      const elapsed = (Date.now() - launchEvent.startedAt) / 1000;
      const remaining = Math.max(0, LAUNCH_DURATION - elapsed);
      setLaunchCountdown(Math.ceil(remaining));

      if (remaining <= 0) {
        dismiss(launchEvent.eventId as any);
        const route =
          launchEvent.gameName === "Texas Hold'em"
            ? `/dashboard/poker?session=${launchEvent.sessionId}`
            : `/dashboard`;
        setLaunchEvent(null);
        router.push(route);
      }
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [launchEvent, dismiss, router]);

  if (isLoading) return <LobbySkeleton />;

  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Lobby</p>
          {myLobby && (
            editingName ? (
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => {
                  const trimmed = draftName.trim();
                  if (trimmed && trimmed !== myLobby.lobby.name) rename(trimmed);
                  setEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="text-[10px] text-muted-foreground bg-card ring-1 ring-border rounded px-1.5 py-0.5 outline-none focus:ring-white/20 w-32"
                maxLength={30}
              />
            ) : (
              <button
                onClick={() => { if (isHost) { setDraftName(myLobby.lobby.name); setEditingName(true); } }}
                className={`text-[10px] text-muted-foreground ${isHost ? "cursor-pointer hover:text-foreground transition-colors" : ""}`}
                title={isHost ? "Click to rename" : undefined}
              >
                — {myLobby.lobby.name}
              </button>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <button className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground rounded-md px-2.5 py-1 bg-card ring-1 ring-border transition-all duration-300 hover:text-white flex items-center gap-1.5">
                <HugeiconsIcon icon={BubbleChatIcon} size={14} />
                Chat
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col !p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle>Lobby Chat</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No messages yet</p>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold shrink-0" style={{ color: msg.accent, textShadow: `0 0 6px ${msg.accent}40` }}>{msg.from}</span>
                        <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                      </div>
                      <p className="text-sm text-zinc-300 mt-0.5">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-border p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg bg-card ring-1 ring-border px-3 py-2 text-sm text-white placeholder:text-muted-foreground outline-none focus:ring-white/20"
                  />
                  <button
                    onClick={handleSend}
                    className="cursor-pointer rounded-lg bg-card ring-1 ring-border px-3 py-2 text-muted-foreground transition-all duration-300 hover:text-white"
                  >
                    <HugeiconsIcon icon={BubbleChatIcon} size={16} />
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <InviteDialog>
            <button className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground rounded-md px-2.5 py-1 bg-card ring-1 ring-border transition-all duration-300 hover:text-white">
              + Invite
            </button>
          </InviteDialog>

          <Dialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
            <DialogTrigger asChild>
              <button
                disabled={isSolo || isLockedInGame}
                className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground rounded-md px-2.5 py-1 bg-card ring-1 ring-border transition-all duration-300 hover:text-white flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                title={isLockedInGame ? "Sit out of the game first" : undefined}
              >
                <HugeiconsIcon icon={Add01Icon} size={12} />
                New
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle>Create New Lobby?</DialogTitle>
                <DialogDescription>
                  You&apos;ll leave your current lobby. Other members will remain.
                </DialogDescription>
              </DialogHeader>
              <input
                type="text"
                value={newLobbyName}
                onChange={(e) => setNewLobbyName(e.target.value)}
                placeholder="Lobby name (optional)"
                className="w-full rounded-lg bg-card ring-1 ring-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-white/20"
                maxLength={30}
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setConfirmNewOpen(false)}
                  className="cursor-pointer flex-1 rounded-lg bg-secondary text-secondary-foreground ring-1 ring-border py-2 text-xs font-medium transition-all hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewLobby}
                  className="cursor-pointer flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-xs font-medium transition-all hover:opacity-90"
                >
                  Create New
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active game rejoin card */}
      {activeSession && activeSession.session.status === "playing" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 rounded-xl bg-emerald-500/5 ring-1 ring-emerald-500/20 p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">♠</span>
            <div>
              <p className="text-sm font-bold text-emerald-400">
                {activeSession.session.gameName} in progress
              </p>
              <p className="text-[10px] text-muted-foreground">
                You have an active game session
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                router.push(
                  `/dashboard/poker?session=${activeSession.session._id}`,
                )
              }
              className="cursor-pointer text-[10px] uppercase tracking-wider text-emerald-400 rounded-lg px-3 py-2 bg-emerald-500/10 ring-1 ring-emerald-500/30 transition-all hover:bg-emerald-500/20"
            >
              Rejoin Game
            </button>
            {canHostEndGame && (
              <button
                onClick={() =>
                  closePokerGame({ sessionId: activeSession.session._id })
                }
                className="cursor-pointer text-[10px] uppercase tracking-wider text-red-400 rounded-lg px-3 py-2 bg-red-500/10 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20"
              >
                End Game
              </button>
            )}
          </div>
        </motion.div>
      )}

      <ScrollRow>
        {players.map((player) => {
          const pc = getProfileCardById(player.cardTheme);
          const isSelf = currentUser?._id === player.userId;
          const canManage = isHost && !isSelf;

          const card = (
            <motion.div
              key={player.userId}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              onClick={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.dispatchEvent(
                  new MouseEvent("contextmenu", {
                    bubbles: true,
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2,
                  }),
                );
              }}
              className={`cursor-pointer group relative shrink-0 ${cardW} rounded-xl overflow-hidden transition-[box-shadow,ring-color] duration-300 text-left`}
              style={{ backgroundColor: pc.nameBg, border: `1px solid ${pc.borderColor}` }}
            >
              {player.isHost && (
                <div className="absolute top-1.5 right-1.5 z-10">
                  <HugeiconsIcon icon={Crown02Icon} size={14} style={{ color: "#fbbf24", filter: "drop-shadow(0 0 4px #fbbf2460)" }} />
                </div>
              )}
              <div className={`${compactMode ? "h-12" : "h-16"} w-full`} style={{ background: player.banner ?? `linear-gradient(135deg, ${pc.avatarRing}, ${pc.avatarRing}80)` }} />
              <div className="relative px-3 pb-3">
                <div
                  className="absolute -top-5 left-3 size-10 rounded-full overflow-hidden transition-shadow duration-300"
                  style={{ boxShadow: `0 0 0 3px ${pc.avatarRing}${glowEffects ? `, 0 0 10px ${pc.avatarRing}40` : ""}` }}
                >
                  <Image src="/background.png" alt={player.name} fill className="object-cover" />
                </div>
                <div className="pt-7">
                  <p className="text-sm font-bold truncate" style={{ color: pc.nameColor, textShadow: glowEffects ? `0 0 8px ${pc.nameColor}60` : undefined }}>{player.name}</p>
                  <p className="text-[10px] truncate" style={{ color: pc.tagColor }}>@{player.tag}</p>
                  <p className="text-[11px] mt-1 truncate" style={{ color: pc.descColor }}>{player.bio}</p>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <StatusDot status={player.status as "ready" | "idle"} />
                  <StatusLabel status={player.status as "ready" | "idle"} />
                </div>
              </div>
            </motion.div>
          );

          return (
            <ContextMenu key={player.userId}>
              <ContextMenuTrigger asChild>
                {card}
              </ContextMenuTrigger>
              <ContextMenuContent className="w-44">
                <ContextMenuItem
                  onClick={() => setSelected({ player, userId: player.userId })}
                  className="gap-2 text-xs"
                >
                  <HugeiconsIcon icon={UserIcon} size={14} />
                  View Profile
                </ContextMenuItem>
                {canManage && (
                  <>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => transferHost(player.userId)}
                      className="gap-2 text-xs"
                    >
                      <HugeiconsIcon icon={Crown02Icon} size={14} />
                      Make Leader
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => setKickTarget({ userId: player.userId, name: player.name })}
                      className="gap-2 text-xs text-destructive focus:text-destructive"
                    >
                      <HugeiconsIcon icon={UserRemove01Icon} size={14} />
                      Kick
                    </ContextMenuItem>
                  </>
                )}
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
        <div className={`group relative shrink-0 ${cardW} rounded-xl overflow-hidden bg-card ring-1 ring-border transition-all duration-300 opacity-40`}>
          <div className="flex flex-col items-center justify-center h-full min-h-[148px]">
            <span className="text-2xl text-muted-foreground">+</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">open slot</span>
          </div>
        </div>
      </ScrollRow>

      {/* Kick Confirmation Dialog */}
      <Dialog open={!!kickTarget} onOpenChange={(open) => { if (!open) setKickTarget(null); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Kick {kickTarget?.name}?</DialogTitle>
            <DialogDescription>
              They&apos;ll be removed from the lobby and placed in their own lobby.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setKickTarget(null)}
              className="cursor-pointer flex-1 rounded-lg bg-secondary text-secondary-foreground ring-1 ring-border py-2 text-xs font-medium transition-all hover:bg-secondary/80"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (kickTarget) kick(kickTarget.userId);
                setKickTarget(null);
              }}
              className="cursor-pointer flex-1 rounded-lg bg-destructive text-white py-2 text-xs font-medium transition-all hover:opacity-90"
            >
              Kick
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {selected && (
        <PlayerDialog player={selected.player} userId={selected.userId} open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }} />
      )}

      {/* Event-driven game launch dialog — unclosable */}
      <Dialog open={!!launchEvent} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-xs !p-0 gap-0 overflow-hidden [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Starting {launchEvent?.gameName}</DialogTitle>
          </DialogHeader>
          <div className="h-24 w-full flex items-center justify-center bg-gradient-to-br from-emerald-800 to-emerald-950">
            <span className="text-4xl drop-shadow-lg">♠️</span>
          </div>
          <div className="px-5 py-5 flex flex-col items-center gap-3">
            <p className="text-base font-bold text-foreground">
              {launchEvent?.gameName}
            </p>
            <p className="text-xs text-muted-foreground">
              Game starting...
            </p>
            <motion.div
              key={launchCountdown}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-bold font-mono text-emerald-400"
            >
              {launchCountdown}
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
