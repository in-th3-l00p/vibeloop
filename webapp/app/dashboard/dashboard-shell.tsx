"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DashboardProvider, useDashboard, type UserInfo } from "./dashboard-context";
import { getTheme } from "./lib/theme-utils";

const FontContext = createContext("");
export const useFont = () => useContext(FontContext);

function ShellInner({ children }: { children: ReactNode }) {
  const { settings } = useDashboard();
  const t = getTheme(settings);

  return (
    <div
      style={{
        ["--background" as string]: t.pageBg,
        ["--card" as string]: t.cardBg,
        ["--card-foreground" as string]: "#fafafa",
        ["--popover" as string]: t.cardBg,
        ["--popover-foreground" as string]: "#fafafa",
        ["--border" as string]: t.cardRing,
        ["--input" as string]: t.cardRing,
        ["--muted" as string]: t.cardBg,
        ["--muted-foreground" as string]: t.textMuted,
        ["--ring" as string]: t.cardRing,
      }}
    >
      {children}
    </div>
  );
}

export function DashboardShell({
  children,
  user,
  italiannoClass,
}: {
  children: ReactNode;
  user: UserInfo;
  italiannoClass: string;
}) {
  return (
    <DashboardProvider user={user}>
      <FontContext.Provider value={italiannoClass}>
        <ShellInner>{children}</ShellInner>
      </FontContext.Provider>
    </DashboardProvider>
  );
}
