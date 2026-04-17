"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";


export interface ProfileCardTheme {
  id: string;
  name: string;
  nameBg: string;
  nameColor: string;
  tagColor: string;
  descColor: string;
  statColor: string;
  labelColor: string;
  borderColor: string;
  avatarRing: string;
  divider: string;
  price: number;
  rarity: "free" | "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export const profileCardThemes: ProfileCardTheme[] = [
  {
    id: "default",
    name: "Default",
    nameBg: "#18181b",
    nameColor: "#ffffff",
    tagColor: "#71717a",
    descColor: "#a1a1aa",
    statColor: "#ffffff",
    labelColor: "#71717a",
    borderColor: "rgba(255,255,255,0.1)",
    avatarRing: "rgba(255,255,255,0.2)",
    divider: "rgba(255,255,255,0.1)",
    price: 0,
    rarity: "free",
  },
  {
    id: "neon-pulse",
    name: "Neon Pulse",
    nameBg: "#1a0a2e",
    nameColor: "#e879f9",
    tagColor: "#a855f7",
    descColor: "#c084fc",
    statColor: "#e879f9",
    labelColor: "#7c3aed",
    borderColor: "rgba(168,85,247,0.3)",
    avatarRing: "#a855f7",
    divider: "rgba(168,85,247,0.2)",
    price: 120,
    rarity: "rare",
  },
  {
    id: "arctic",
    name: "Arctic",
    nameBg: "#0c1929",
    nameColor: "#7dd3fc",
    tagColor: "#38bdf8",
    descColor: "#7dd3fc",
    statColor: "#bae6fd",
    labelColor: "#0369a1",
    borderColor: "rgba(56,189,248,0.2)",
    avatarRing: "#38bdf8",
    divider: "rgba(56,189,248,0.15)",
    price: 80,
    rarity: "uncommon",
  },
  {
    id: "inferno",
    name: "Inferno",
    nameBg: "#1c0a0a",
    nameColor: "#fca5a5",
    tagColor: "#f87171",
    descColor: "#fca5a5",
    statColor: "#fecaca",
    labelColor: "#991b1b",
    borderColor: "rgba(239,68,68,0.25)",
    avatarRing: "#ef4444",
    divider: "rgba(239,68,68,0.15)",
    price: 200,
    rarity: "rare",
  },
  {
    id: "gold-elite",
    name: "Gold Elite",
    nameBg: "#1a1505",
    nameColor: "#fde68a",
    tagColor: "#f59e0b",
    descColor: "#fcd34d",
    statColor: "#fde68a",
    labelColor: "#92400e",
    borderColor: "rgba(245,158,11,0.3)",
    avatarRing: "#f59e0b",
    divider: "rgba(245,158,11,0.2)",
    price: 500,
    rarity: "legendary",
  },
  {
    id: "phantom",
    name: "Phantom",
    nameBg: "#09090b",
    nameColor: "#a1a1aa",
    tagColor: "#52525b",
    descColor: "#71717a",
    statColor: "#a1a1aa",
    labelColor: "#3f3f46",
    borderColor: "rgba(255,255,255,0.04)",
    avatarRing: "rgba(255,255,255,0.1)",
    divider: "rgba(255,255,255,0.04)",
    price: 40,
    rarity: "common",
  },
  {
    id: "emerald-crown",
    name: "Emerald Crown",
    nameBg: "#052e16",
    nameColor: "#86efac",
    tagColor: "#34d399",
    descColor: "#6ee7b7",
    statColor: "#a7f3d0",
    labelColor: "#065f46",
    borderColor: "rgba(52,211,153,0.25)",
    avatarRing: "#34d399",
    divider: "rgba(52,211,153,0.15)",
    price: 350,
    rarity: "epic",
  },
];


export interface UiTheme {
  name: string;
  cardBg: string;
  cardRing: string;
  textMuted: string;
}

export const uiThemes: UiTheme[] = [
  { name: "Default",  cardBg: "#18181b", cardRing: "rgba(255,255,255,0.1)",  textMuted: "#a1a1aa" },
  { name: "Midnight", cardBg: "#0f172a", cardRing: "rgba(59,130,246,0.15)",  textMuted: "#94a3b8" },
  { name: "Ember",    cardBg: "#1c1412", cardRing: "rgba(249,115,22,0.15)",  textMuted: "#a8a29e" },
  { name: "Forest",   cardBg: "#0f1a14", cardRing: "rgba(52,211,153,0.15)",  textMuted: "#86efac" },
  { name: "Void",     cardBg: "#09090b", cardRing: "rgba(255,255,255,0.04)", textMuted: "#71717a" },
];


export const pageBgPresets = [
  { name: "Default",  value: "#030712" },
  { name: "Midnight", value: "#020617" },
  { name: "Charcoal", value: "#0a0a0a" },
  { name: "Ink",      value: "#000000" },
  { name: "Deep Navy",value: "#0a0f1e" },
  { name: "Ember",    value: "#0c0907" },
  { name: "Forest",   value: "#030f09" },
  { name: "Plum",     value: "#0d0515" },
];


export const titleColorPresets = [
  { name: "White",   value: "#ffffff" },
  { name: "Purple",  value: "#a855f7" },
  { name: "Cyan",    value: "#22d3ee" },
  { name: "Orange",  value: "#f97316" },
  { name: "Emerald", value: "#34d399" },
  { name: "Rose",    value: "#f43f5e" },
  { name: "Amber",   value: "#fbbf24" },
  { name: "Sky",     value: "#38bdf8" },
  { name: "Lavender",value: "#a78bfa" },
];

export interface DashboardSettings {
  profileCardTheme: string;
  welcomeText: string;
  titleColor: string;
  pageBg: string;
  uiTheme: number;
  showWelcome: boolean;
  showLobby: boolean;
  showGames: boolean;
  showMarketplace: boolean;
  compactMode: boolean;
  glowEffects: boolean;
}

const defaults: DashboardSettings = {
  profileCardTheme: "default",
  welcomeText: "Welcome, {{first_name}}",
  titleColor: "#ffffff",
  pageBg: "#030712",
  uiTheme: 0,
  showWelcome: true,
  showLobby: true,
  showGames: true,
  showMarketplace: true,
  compactMode: false,
  glowEffects: true,
};


export function getProfileCard(settings: DashboardSettings): ProfileCardTheme {
  return profileCardThemes.find((t) => t.id === settings.profileCardTheme) ?? profileCardThemes[0];
}

export function getTheme(settings: DashboardSettings) {
  const ui = uiThemes[settings.uiTheme] ?? uiThemes[0];
  return {
    pageBg: settings.pageBg,
    cardBg: ui.cardBg,
    cardRing: ui.cardRing,
    textMuted: ui.textMuted,
    glow: settings.glowEffects,
  };
}

export function resolveWelcomeText(
  template: string,
  vars: { firstName: string; username: string }
) {
  return template
    .replace(/\{\{first_name\}\}/g, vars.firstName)
    .replace(/\{\{username\}\}/g, vars.username);
}


interface DashboardContextValue {
  settings: DashboardSettings;
  update: <K extends keyof DashboardSettings>(
    key: K,
    value: DashboardSettings[K]
  ) => void;
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

export function DashboardProvider({ children }: { children: ReactNode }) {
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

  function update<K extends keyof DashboardSettings>(
    key: K,
    value: DashboardSettings[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setSettings(defaults);
  }

  return (
    <DashboardContext.Provider value={{ settings, update, reset }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
