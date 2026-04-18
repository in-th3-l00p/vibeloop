"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatIcon } from "@hugeicons/core-free-icons";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDashboard } from "../dashboard-context";
import { useLobby } from "@/hooks/use-lobby";
import { useLobbyChat } from "@/hooks/use-lobby-chat";
import { ScrollRow } from "../components/ui/scroll-row";
import { StatusDot, StatusLabel } from "../components/ui/status-indicator";
import { InviteDialog } from "../components/invite-dialog";
import { PlayerDialog } from "../components/player-dialog";
import { LobbySkeleton } from "../components/ui/skeleton-primitives";
import type { Player } from "../types";

export function Lobby() {
  const { settings } = useDashboard();
  const { compactMode, glowEffects } = settings;
  const cardW = compactMode ? "w-32" : "w-40";
  const [selected, setSelected] = useState<Player | null>(null);

  const { myLobby, isLoading } = useLobby();
  const lobbyId = myLobby?.lobby?._id ?? null;
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

  if (isLoading) return <LobbySkeleton />;

  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Lobby</p>
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
        </div>
      </div>

      <ScrollRow>
        {players.map((player) => (
          <motion.button
            key={player.name}
            onClick={() => setSelected(player)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className={`cursor-pointer group relative shrink-0 ${cardW} rounded-xl overflow-hidden bg-card ring-1 ring-border transition-[box-shadow,ring-color] duration-300 text-left`}
          >
            <div className={`${compactMode ? "h-12" : "h-16"} w-full`} style={{ background: player.banner }} />
            <div className="relative px-3 pb-3">
              <div
                className="absolute -top-5 left-3 size-10 rounded-full overflow-hidden transition-shadow duration-300"
                style={{ outline: `3px solid ${player.accent}`, boxShadow: glowEffects ? `0 0 10px ${player.accent}40` : undefined }}
              >
                <Image src="/background.png" alt={player.name} fill className="object-cover" />
              </div>
              <div className="pt-7">
                <p className="text-sm font-bold truncate" style={{ color: player.accent, textShadow: glowEffects ? `0 0 8px ${player.accent}60` : undefined }}>{player.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">@{player.tag}</p>
                <p className="text-[11px] text-zinc-400 mt-1 truncate">{player.bio}</p>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <StatusDot status={player.status as "ready" | "idle"} />
                <StatusLabel status={player.status as "ready" | "idle"} />
              </div>
            </div>
          </motion.button>
        ))}
        <div className={`group relative shrink-0 ${cardW} rounded-xl overflow-hidden bg-card ring-1 ring-border transition-all duration-300 opacity-40`}>
          <div className="flex flex-col items-center justify-center h-full min-h-[148px]">
            <span className="text-2xl text-muted-foreground">+</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">open slot</span>
          </div>
        </div>
      </ScrollRow>

      {selected && (
        <PlayerDialog player={selected} open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }} />
      )}
    </div>
  );
}
