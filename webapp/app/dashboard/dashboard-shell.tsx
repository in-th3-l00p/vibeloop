"use client";

import type { ReactNode } from "react";
import { DashboardProvider, useDashboard, getTheme } from "./dashboard-context";

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

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <ShellInner>{children}</ShellInner>
    </DashboardProvider>
  );
}
