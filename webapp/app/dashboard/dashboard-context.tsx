"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserSettings } from "@/hooks/use-user-settings";
import { usePresence } from "@/hooks/use-presence";
import type { DashboardSettings } from "./types";

export interface UserInfo {
  username: string;
  fullName: string;
  imageUrl: string;
  firstName: string;
  bio: string;
  accent: string;
  vibeBalance: number;
  tag: string;
}

interface DashboardContextValue {
  settings: DashboardSettings;
  user: UserInfo;
  isLoading: boolean;
  update: <K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => void;
  reset: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

const fallbackUser: UserInfo = {
  username: "player",
  fullName: "Loading...",
  imageUrl: "",
  firstName: "Player",
  bio: "",
  accent: "#a855f7",
  vibeBalance: 0,
  tag: "player",
};

export function DashboardProvider({
  children,
  clerkUser,
}: {
  children: ReactNode;
  clerkUser: { username: string; fullName: string; imageUrl: string; firstName: string };
}) {
  const { user: convexUser, isLoading: userLoading } = useCurrentUser();
  const { settings, isLoading: settingsLoading, update, reset } = useUserSettings();

  // Send presence heartbeat while on the dashboard
  usePresence("online");

  const user: UserInfo = convexUser
    ? {
        username: convexUser.username,
        fullName: convexUser.fullName,
        imageUrl: convexUser.imageUrl,
        firstName: convexUser.firstName,
        bio: convexUser.bio,
        accent: convexUser.accent,
        vibeBalance: convexUser.vibeBalance,
        tag: convexUser.tag,
      }
    : { ...fallbackUser, ...clerkUser };

  const isLoading = userLoading || settingsLoading;

  return (
    <DashboardContext.Provider value={{ settings, user, isLoading, update, reset }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
