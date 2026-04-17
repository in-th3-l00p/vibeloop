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
    </main>
  );
}
