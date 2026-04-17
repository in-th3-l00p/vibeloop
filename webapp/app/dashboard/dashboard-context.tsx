"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { DashboardSettings } from "./types";

const defaults: DashboardSettings = {
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

export interface UserInfo {
  username: string;
  fullName: string;
  imageUrl: string;
  firstName: string;
}

interface DashboardContextValue {
  settings: DashboardSettings;
  user: UserInfo;
  update: <K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => void;
  reset: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);
const STORAGE_KEY = "vibeloop-dashboard";

function loadSettings(): DashboardSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function DashboardProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: UserInfo;
}) {
  const [settings, setSettings] = useState<DashboardSettings>(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  function update<K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setSettings(defaults);
  }

  return (
    <DashboardContext.Provider value={{ settings, user, update, reset }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
