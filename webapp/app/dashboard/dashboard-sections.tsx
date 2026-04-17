"use client";

import { useDashboard } from "./dashboard-context";
import { Welcome } from "./sections/welcome";
import { ProfileCard } from "./sections/profile-card";
import { QuickActions } from "./sections/quick-actions";
import { Lobby } from "./sections/lobby";
import { Games } from "./sections/games";
import { Marketplace } from "./sections/marketplace";

export function DashboardSections() {
  const { settings } = useDashboard();
  const { showWelcome, showLobby, showGames, showMarketplace, compactMode } = settings;

  return (
    <main
      className={`w-full min-h-screen bg-background text-white flex flex-col items-center justify-center px-4 py-20 transition-colors duration-500 ${compactMode ? "gap-4" : "gap-6"}`}
    >
      {showWelcome && <Welcome />}
      <ProfileCard />
      <QuickActions />
      {showLobby && <Lobby />}
      {showGames && <Games />}
      {showMarketplace && <Marketplace />}
    </main>
  );
}
