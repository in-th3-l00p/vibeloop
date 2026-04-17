import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartBarIncreasingIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Lobby } from "./lobby";
import { Friends } from "./friends";
import { Search } from "./search";

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
        <Search />
        {[
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
        <Friends />
      </div>

      <Lobby />

      <div className="w-full max-w-xl mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Games</p>
          <button className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-500 ring-1 ring-white/10 rounded-md px-2.5 py-1 bg-zinc-900/80 shadow-[0_0_10px_rgba(255,255,255,0.04)] transition-all duration-300 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.12)]">
            View All
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {[
            {
              name: "Vibecheck",
              desc: "Vote on hot takes. Majority wins.",
              players: "2–10",
              tag: "party",
              accent: "#a855f7",
              gradient: "linear-gradient(135deg, #6d28d9, #db2777)",
              emoji: "🔥",
            },
            {
              name: "Drawl",
              desc: "Sketch prompts. Friends guess blind.",
              players: "3–8",
              tag: "creative",
              accent: "#22d3ee",
              gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
              emoji: "🎨",
            },
            {
              name: "Bluff Royale",
              desc: "Lie your way to victory. Trust no one.",
              players: "4–10",
              tag: "strategy",
              accent: "#f97316",
              gradient: "linear-gradient(135deg, #f97316, #ef4444)",
              emoji: "🃏",
            },
            {
              name: "Wavelength",
              desc: "Guess where your friend lands on the spectrum.",
              players: "2–8",
              tag: "social",
              accent: "#34d399",
              gradient: "linear-gradient(135deg, #10b981, #059669)",
              emoji: "📡",
            },
            {
              name: "Speed Trivia",
              desc: "First to buzz wins. No second chances.",
              players: "2–12",
              tag: "trivia",
              accent: "#fbbf24",
              gradient: "linear-gradient(135deg, #f59e0b, #eab308)",
              emoji: "⚡",
            },
            {
              name: "Conspirators",
              desc: "Find the traitor before it's too late.",
              players: "5–10",
              tag: "deception",
              accent: "#f43f5e",
              gradient: "linear-gradient(135deg, #e11d48, #9f1239)",
              emoji: "🕵️",
            },
          ].map((game) => (
            <button
              key={game.name}
              className="cursor-pointer group relative shrink-0 w-44 overflow-hidden rounded-xl ring-1 ring-white/10 bg-zinc-900/80 shadow-[0_0_12px_rgba(255,255,255,0.04)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,255,255,0.12)] text-left"
            >
              <div
                className="h-14 w-full opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                style={{ background: game.gradient }}
              />
              <div className="absolute top-2.5 right-3 text-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
                {game.emoji}
              </div>

              <div className="px-3.5 pb-3.5 pt-2.5">
                <p
                  className="text-sm font-bold truncate"
                  style={{
                    color: game.accent,
                    textShadow: `0 0 8px ${game.accent}60`,
                  }}
                >
                  {game.name}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {game.desc}
                </p>

                <div className="flex items-center justify-between mt-2.5">
                  <span
                    className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      color: game.accent,
                      backgroundColor: `${game.accent}15`,
                    }}
                  >
                    {game.tag}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {game.players}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
