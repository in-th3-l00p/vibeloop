"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { DashboardSettings } from "@/app/dashboard/types";

const DEFAULTS: DashboardSettings = {
  profileCardTheme: "default",
  welcomeText: "Welcome, {{first_name}}",
  titleColor: "#ffffff",
  uiTheme: 0,
  showWelcome: true,
  showLobby: true,
  showGames: true,
  showMarketplace: true,
  compactMode: false,
  glowEffects: true,
};

export function useUserSettings() {
  const raw = useQuery(api.settings.get);
  const updateMutation = useMutation(api.settings.update);
  const resetMutation = useMutation(api.settings.reset);

  const settings: DashboardSettings = raw
    ? {
        profileCardTheme: raw.profileCardTheme,
        welcomeText: raw.welcomeText,
        titleColor: raw.titleColor,
        uiTheme: raw.uiTheme,
        showWelcome: raw.showWelcome,
        showLobby: raw.showLobby,
        showGames: raw.showGames,
        showMarketplace: raw.showMarketplace,
        compactMode: raw.compactMode,
        glowEffects: raw.glowEffects,
      }
    : DEFAULTS;

  function update<K extends keyof DashboardSettings>(
    key: K,
    value: DashboardSettings[K],
  ) {
    updateMutation({ key, value: value as string | number | boolean });
  }

  function reset() {
    resetMutation();
  }

  return {
    settings,
    isLoading: raw === undefined,
    update,
    reset,
  };
}
