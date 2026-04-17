"use client";

import { useDashboard } from "../dashboard-context";

const games = [
  { name: "Vibecheck", desc: "Vote on hot takes. Majority wins.", players: "2–10", tag: "party", accent: "#a855f7", gradient: "linear-gradient(135deg, #6d28d9, #db2777)", emoji: "🔥" },
  { name: "Drawl", desc: "Sketch prompts. Friends guess blind.", players: "3–8", tag: "creative", accent: "#22d3ee", gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)", emoji: "🎨" },
  { name: "Bluff Royale", desc: "Lie your way to victory. Trust no one.", players: "4–10", tag: "strategy", accent: "#f97316", gradient: "linear-gradient(135deg, #f97316, #ef4444)", emoji: "🃏" },
  { name: "Wavelength", desc: "Guess where your friend lands on the spectrum.", players: "2–8", tag: "social", accent: "#34d399", gradient: "linear-gradient(135deg, #10b981, #059669)", emoji: "📡" },
  { name: "Speed Trivia", desc: "First to buzz wins. No second chances.", players: "2–12", tag: "trivia", accent: "#fbbf24", gradient: "linear-gradient(135deg, #f59e0b, #eab308)", emoji: "⚡" },
  { name: "Conspirators", desc: "Find the traitor before it's too late.", players: "5–10", tag: "deception", accent: "#f43f5e", gradient: "linear-gradient(135deg, #e11d48, #9f1239)", emoji: "🕵️" },
];

export function Games() {
  const { settings } = useDashboard();
  const { compactMode, glowEffects } = settings;
  const cardWidth = compactMode ? "w-36" : "w-44";

  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Games</p>
        <button className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground rounded-md px-2.5 py-1 bg-card ring-1 ring-border transition-all duration-300 hover:text-white">
          View All
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {games.map((game) => (
          <button
            key={game.name}
            className={`cursor-pointer group relative shrink-0 ${cardWidth} overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 text-left`}
          >
            <div
              className={`${compactMode ? "h-10" : "h-14"} w-full opacity-60 group-hover:opacity-80 transition-opacity duration-300`}
              style={{ background: game.gradient }}
            />
            <div className="absolute top-2.5 right-3 text-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
              {game.emoji}
            </div>
            <div className={compactMode ? "px-2.5 pb-2.5 pt-2" : "px-3.5 pb-3.5 pt-2.5"}>
              <p
                className="text-sm font-bold truncate"
                style={{ color: game.accent, textShadow: glowEffects ? `0 0 8px ${game.accent}60` : undefined }}
              >
                {game.name}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{game.desc}</p>
              <div className="flex items-center justify-between mt-2.5">
                <span
                  className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full"
                  style={{ color: game.accent, backgroundColor: `${game.accent}15` }}
                >
                  {game.tag}
                </span>
                <span className="text-[10px] text-muted-foreground">{game.players}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
