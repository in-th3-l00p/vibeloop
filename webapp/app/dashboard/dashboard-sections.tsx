"use client";

import Image from "next/image";
import { Lobby } from "./lobby";
import { Friends } from "./friends";
import { Search } from "./search";
import { Stats } from "./stats";
import { Settings } from "./settings";
import { useDashboard, getProfileCard, resolveWelcomeText } from "./dashboard-context";

const games = [
  { name: "Vibecheck", desc: "Vote on hot takes. Majority wins.", players: "2–10", tag: "party", accent: "#a855f7", gradient: "linear-gradient(135deg, #6d28d9, #db2777)", emoji: "🔥" },
  { name: "Drawl", desc: "Sketch prompts. Friends guess blind.", players: "3–8", tag: "creative", accent: "#22d3ee", gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)", emoji: "🎨" },
  { name: "Bluff Royale", desc: "Lie your way to victory. Trust no one.", players: "4–10", tag: "strategy", accent: "#f97316", gradient: "linear-gradient(135deg, #f97316, #ef4444)", emoji: "🃏" },
  { name: "Wavelength", desc: "Guess where your friend lands on the spectrum.", players: "2–8", tag: "social", accent: "#34d399", gradient: "linear-gradient(135deg, #10b981, #059669)", emoji: "📡" },
  { name: "Speed Trivia", desc: "First to buzz wins. No second chances.", players: "2–12", tag: "trivia", accent: "#fbbf24", gradient: "linear-gradient(135deg, #f59e0b, #eab308)", emoji: "⚡" },
  { name: "Conspirators", desc: "Find the traitor before it's too late.", players: "5–10", tag: "deception", accent: "#f43f5e", gradient: "linear-gradient(135deg, #e11d48, #9f1239)", emoji: "🕵️" },
];

const marketplaceItems = [
  { name: "Neon Pulse", type: "Card Theme", price: "120", accent: "#a855f7", gradient: "linear-gradient(135deg, #7c3aed, #c026d3, #e879f9)", rarity: "rare" },
  { name: "OG Founder", type: "Badge", price: "500", accent: "#fbbf24", gradient: "linear-gradient(135deg, #f59e0b, #d97706, #b45309)", rarity: "legendary" },
  { name: "Glacier", type: "Card Theme", price: "80", accent: "#38bdf8", gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4, #67e8f9)", rarity: "uncommon" },
  { name: "Hot Streak", type: "Badge", price: "200", accent: "#f97316", gradient: "linear-gradient(135deg, #ef4444, #f97316, #fbbf24)", rarity: "rare" },
  { name: "Phantom", type: "Avatar Border", price: "150", accent: "#a78bfa", gradient: "linear-gradient(135deg, #4c1d95, #6d28d9, #8b5cf6)", rarity: "rare" },
  { name: "Emerald Crown", type: "Badge", price: "350", accent: "#34d399", gradient: "linear-gradient(135deg, #047857, #059669, #10b981)", rarity: "epic" },
  { name: "Bloodline", type: "Card Theme", price: "300", accent: "#f43f5e", gradient: "linear-gradient(135deg, #9f1239, #e11d48, #fb7185)", rarity: "epic" },
  { name: "Minimal", type: "Avatar Border", price: "40", accent: "#a1a1aa", gradient: "linear-gradient(135deg, #3f3f46, #52525b, #71717a)", rarity: "common" },
];

export function DashboardSections({
  username,
  fullName,
  imageUrl,
  italiannoClass,
}: {
  username: string;
  fullName: string;
  imageUrl: string;
  italiannoClass: string;
}) {
  const { settings } = useDashboard();
  const { showWelcome, showLobby, showGames, showMarketplace, compactMode, glowEffects } = settings;
  const pc = getProfileCard(settings);
  const firstName = fullName.split(" ")[0];
  const cardWidth = compactMode ? "w-36" : "w-44";

  return (
    <main className={`w-full min-h-screen bg-background text-white flex flex-col items-center justify-center px-4 py-20 transition-colors duration-500 ${compactMode ? "gap-4" : "gap-6"}`}>
      {showWelcome && (
        <h1
          className={`${italiannoClass} text-6xl md:text-8xl text-center leading-none`}
          style={{
            color: settings.titleColor,
            textShadow: glowEffects ? `0 0 30px ${settings.titleColor}40, 0 0 60px ${settings.titleColor}15` : undefined,
          }}
        >
          {resolveWelcomeText(settings.welcomeText, { firstName, username })}
        </h1>
      )}

      {/* Profile Card — uses its own profileCardTheme */}
      <div
        className="w-full max-w-xl lg:max-w-3xl rounded-lg transition-all duration-300"
        style={{
          backgroundColor: pc.nameBg,
          outline: `1px solid ${pc.borderColor}`,
          boxShadow: glowEffects ? `0 0 20px ${pc.borderColor}` : undefined,
        }}
      >
        <div className={`flex items-center gap-5 px-5 ${compactMode ? "py-2" : "py-3"}`}>
          <div
            className="relative size-12 shrink-0 rounded-full overflow-hidden"
            style={{ outline: `2px solid ${pc.avatarRing}`, boxShadow: glowEffects ? `0 0 12px ${pc.avatarRing}60` : undefined }}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt={fullName} fill className="object-cover" />
            ) : (
              <div className="size-full bg-zinc-700 flex items-center justify-center text-lg font-bold">{fullName.charAt(0)}</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: pc.nameColor, textShadow: glowEffects ? `0 0 8px ${pc.nameColor}50` : undefined }}>{fullName}</p>
            <p className="text-xs truncate" style={{ color: pc.tagColor }}>@{username}</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: pc.descColor }}>No description yet.</p>
          </div>
          <div className="shrink-0 text-center pl-4" style={{ borderLeft: `1px solid ${pc.divider}` }}>
            <p className="text-lg font-bold leading-tight" style={{ color: pc.statColor, textShadow: glowEffects ? `0 0 8px ${pc.statColor}40` : undefined }}>0.00</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: pc.labelColor }}>$VIBE</p>
          </div>
          <div className="shrink-0 flex gap-4 text-center pl-3" style={{ borderLeft: `1px solid ${pc.divider}` }}>
            <div><p className="text-sm font-bold" style={{ color: pc.statColor }}>0</p><p className="text-[10px] uppercase tracking-wider" style={{ color: pc.labelColor }}>Games</p></div>
            <div><p className="text-sm font-bold" style={{ color: pc.statColor }}>0</p><p className="text-[10px] uppercase tracking-wider" style={{ color: pc.labelColor }}>Wins</p></div>
            <div><p className="text-sm font-bold" style={{ color: pc.statColor }}>—</p><p className="text-[10px] uppercase tracking-wider" style={{ color: pc.labelColor }}>Rank</p></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-xl lg:max-w-3xl -mt-3">
        <Search />
        <Stats />
        <Settings username={username} fullName={fullName} imageUrl={imageUrl} />
        <Friends />
      </div>

      {showLobby && <Lobby />}

      {showGames && (
        <div className="w-full max-w-xl lg:max-w-3xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Games</p>
            <button className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground rounded-md px-2.5 py-1 bg-card ring-1 ring-border transition-all duration-300 hover:text-white">View All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {games.map((game) => (
              <button key={game.name} className={`cursor-pointer group relative shrink-0 ${cardWidth} overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 text-left`}>
                <div className={`${compactMode ? "h-10" : "h-14"} w-full opacity-60 group-hover:opacity-80 transition-opacity duration-300`} style={{ background: game.gradient }} />
                <div className="absolute top-2.5 right-3 text-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">{game.emoji}</div>
                <div className={compactMode ? "px-2.5 pb-2.5 pt-2" : "px-3.5 pb-3.5 pt-2.5"}>
                  <p className="text-sm font-bold truncate" style={{ color: game.accent, textShadow: glowEffects ? `0 0 8px ${game.accent}60` : undefined }}>{game.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{game.desc}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full" style={{ color: game.accent, backgroundColor: `${game.accent}15` }}>{game.tag}</span>
                    <span className="text-[10px] text-muted-foreground">{game.players}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showMarketplace && (
        <div className="w-full max-w-xl lg:max-w-3xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Marketplace</p>
            <button className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground rounded-md px-2.5 py-1 bg-card ring-1 ring-border transition-all duration-300 hover:text-white">Browse All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {marketplaceItems.map((item) => {
              const rc = { common: "#a1a1aa", uncommon: "#22d3ee", rare: "#a855f7", epic: "#f43f5e", legendary: "#fbbf24" }[item.rarity];
              return (
                <button key={item.name} className={`cursor-pointer group relative shrink-0 ${compactMode ? "w-28" : "w-36"} overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 text-left`}>
                  <div className={`${compactMode ? "h-14" : "h-20"} w-full opacity-50 group-hover:opacity-75 transition-opacity duration-300 flex items-center justify-center`} style={{ background: item.gradient }}>
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full backdrop-blur-sm" style={{ color: rc, backgroundColor: `${rc}20`, border: `1px solid ${rc}40` }}>{item.rarity}</span>
                  </div>
                  <div className={compactMode ? "px-2 pb-2 pt-1.5" : "px-3 pb-3 pt-2"}>
                    <p className="text-xs font-bold truncate" style={{ color: item.accent, textShadow: glowEffects ? `0 0 8px ${item.accent}60` : undefined }}>{item.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.type}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] font-bold text-white">{item.price}</span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">$VIBE</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
