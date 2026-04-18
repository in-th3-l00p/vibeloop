"use client";

import Image from "next/image";
import { useDashboard } from "../dashboard-context";
import { useGameStats } from "@/hooks/use-game-stats";
import { getProfileCard } from "../lib/theme-utils";

export function ProfileCard() {
  const { settings, user } = useDashboard();
  const { compactMode, glowEffects } = settings;
  const pc = getProfileCard(settings);
  const { totalPlayed, totalWins } = useGameStats();

  return (
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
          style={{
            outline: `2px solid ${pc.avatarRing}`,
            boxShadow: glowEffects ? `0 0 12px ${pc.avatarRing}60` : undefined,
          }}
        >
          {user.imageUrl ? (
            <Image src={user.imageUrl} alt={user.fullName} fill className="object-cover" />
          ) : (
            <div className="size-full bg-zinc-700 flex items-center justify-center text-lg font-bold">
              {user.fullName.charAt(0)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: pc.nameColor, textShadow: glowEffects ? `0 0 8px ${pc.nameColor}50` : undefined }}>{user.fullName}</p>
          <p className="text-xs truncate" style={{ color: pc.tagColor }}>@{user.username}</p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: pc.descColor }}>{user.bio || "No description yet."}</p>
        </div>

        <div className="shrink-0 text-center pl-4" style={{ borderLeft: `1px solid ${pc.divider}` }}>
          <p className="text-lg font-bold leading-tight" style={{ color: pc.statColor, textShadow: glowEffects ? `0 0 8px ${pc.statColor}40` : undefined }}>
            {user.vibeBalance.toFixed(2)}
          </p>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: pc.labelColor }}>$VIBE</p>
        </div>

        <div className="shrink-0 flex gap-4 text-center pl-3" style={{ borderLeft: `1px solid ${pc.divider}` }}>
          <div>
            <p className="text-sm font-bold" style={{ color: pc.statColor }}>{totalPlayed}</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: pc.labelColor }}>Games</p>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: pc.statColor }}>{totalWins}</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: pc.labelColor }}>Wins</p>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: pc.statColor }}>—</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: pc.labelColor }}>Rank</p>
          </div>
        </div>
      </div>
    </div>
  );
}
