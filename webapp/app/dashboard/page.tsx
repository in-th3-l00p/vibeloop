import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GameController01Icon,
  UserGroupIcon,
  ChartBarIncreasingIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default async function Dashboard() {
  const user = await currentUser();

  const username = user?.username ?? "player";
  const fullName = user?.fullName ?? "Anonymous Player";
  const imageUrl = user?.imageUrl ?? "";

  return (
    <main className="w-full min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <Card className="w-full max-w-xl bg-zinc-900/80 border-none ring-white/10 text-white !gap-0 !py-0 shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-shadow duration-300 hover:shadow-[0_0_35px_rgba(255,255,255,0.12)]">
        <CardContent className="flex items-center gap-5 px-5 py-3">
          <div className="relative size-12 shrink-0 rounded-full overflow-hidden ring-2 ring-white/20 shadow-[0_0_12px_rgba(255,255,255,0.1)]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={fullName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="size-full bg-zinc-700 flex items-center justify-center text-lg font-bold">
                {fullName.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{fullName}</p>
            <p className="text-xs text-zinc-500 truncate">@{username}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">No description yet.</p>
          </div>

          <div className="shrink-0 text-center pl-4 border-l border-white/10">
            <p className="text-lg font-bold text-white leading-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">0.00</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">$VIBE</p>
          </div>

          <div className="shrink-0 flex gap-4 text-center pl-3 border-l border-white/10">
            <div>
              <p className="text-sm font-bold text-white">0</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Games</p>
            </div>
            <div>
              <p className="text-sm font-bold text-white">0</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Wins</p>
            </div>
            <div>
              <p className="text-sm font-bold text-white">—</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Rank</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-3 w-full max-w-xl mt-3">
        {[
          { icon: GameController01Icon, label: "New Lobby" },
          { icon: UserGroupIcon, label: "Friends" },
          { icon: ChartBarIncreasingIcon, label: "Stats" },
          { icon: Settings01Icon, label: "Settings" },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className="cursor-pointer flex flex-col items-center gap-2 rounded-lg bg-zinc-900/80 ring-1 ring-white/10 py-4 text-zinc-400 shadow-[0_0_12px_rgba(255,255,255,0.04)] transition-all duration-300 hover:bg-zinc-800/80 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.12)]"
          >
            <HugeiconsIcon icon={icon} size={22} />
            <span className="text-[11px] uppercase tracking-wider">{label}</span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-xl mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Lobby</p>
          <button className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-500 ring-1 ring-white/10 rounded-md px-2.5 py-1 bg-zinc-900/80 shadow-[0_0_10px_rgba(255,255,255,0.04)] transition-all duration-300 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.12)]">
            + Add
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {([
            {
              name: "xViper",
              tag: "viper",
              status: "ready" as const,
              banner: "linear-gradient(135deg, #6d28d9, #db2777, #f59e0b)",
              accent: "#a855f7",
              bio: "ranked demon",
            },
            {
              name: "NovaKid",
              tag: "nova",
              status: "ready" as const,
              banner: "linear-gradient(135deg, #0ea5e9, #06b6d4, #22d3ee)",
              accent: "#22d3ee",
              bio: "chill vibes only",
            },
            {
              name: "GhostRacer",
              tag: "ghost",
              status: "idle" as const,
              banner: "linear-gradient(135deg, #f97316, #ef4444, #dc2626)",
              accent: "#f97316",
              bio: "speed is everything",
            },
            {
              name: "ZenithX",
              tag: "zenith",
              status: "ready" as const,
              banner: "linear-gradient(135deg, #10b981, #059669, #047857)",
              accent: "#34d399",
              bio: "gg ez",
            },
            {
              name: "LunaWolf",
              tag: "luna",
              status: "idle" as const,
              banner: "linear-gradient(135deg, #8b5cf6, #6d28d9, #4c1d95)",
              accent: "#a78bfa",
              bio: "howl at the moon",
            },
            {
              name: null,
              tag: null,
              status: "open" as const,
              banner: null,
              accent: null,
              bio: null,
            },
          ] as const).map((player, i) => (
            <div
              key={player.name ?? i}
              className={`group relative shrink-0 w-40 rounded-xl overflow-hidden ring-1 ring-white/10 transition-all duration-300 ${
                player.status === "open"
                  ? "opacity-40 bg-zinc-900/50"
                  : "bg-zinc-900/80 shadow-[0_0_12px_rgba(255,255,255,0.04)] hover:shadow-[0_0_25px_rgba(255,255,255,0.12)]"
              }`}
            >
              {player.status !== "open" ? (
                <>
                  <div
                    className="h-16 w-full"
                    style={{ background: player.banner! }}
                  />

                  <div className="relative px-3 pb-3">
                    <div
                      className="absolute -top-5 left-3 size-10 rounded-full overflow-hidden transition-shadow duration-300"
                      style={{
                        outlineColor: player.accent!,
                        outline: `3px solid ${player.accent}`,
                        boxShadow: `0 0 10px ${player.accent}40`,
                      }}
                    >
                      <Image
                        src="/background.png"
                        alt={player.name!}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="pt-7">
                      <p
                        className="text-sm font-bold truncate"
                        style={{
                          color: player.accent!,
                          textShadow: `0 0 8px ${player.accent}60`,
                        }}
                      >
                        {player.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate">@{player.tag}</p>
                      <p className="text-[11px] text-zinc-400 mt-1 truncate">{player.bio}</p>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className="size-1.5 rounded-full"
                        style={{
                          backgroundColor: player.status === "ready" ? "#34d399" : "#fbbf24",
                          boxShadow: `0 0 6px ${player.status === "ready" ? "#34d39980" : "#fbbf2480"}`,
                        }}
                      />
                      <span
                        className={`text-[9px] uppercase tracking-wider font-medium ${
                          player.status === "ready" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {player.status}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[148px]">
                  <span className="text-2xl text-zinc-600">+</span>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">open slot</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
