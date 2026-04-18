"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { DashboardProvider, useDashboard } from "./dashboard-context";
import { getActiveTheme } from "./lib/theme-utils";

const FontContext = createContext("");
export const useFont = () => useContext(FontContext);

function ThemeApplicator({ children }: { children: ReactNode }) {
  const { settings } = useDashboard();
  const theme = getActiveTheme(settings);

  useEffect(() => {
    const root = document.documentElement;
    const entries = Object.entries(theme.cssVars);
    for (const [key, value] of entries) {
      root.style.setProperty(key, value);
    }
    return () => {
      for (const [key] of entries) {
        root.style.removeProperty(key);
      }
    };
  }, [theme]);

  return <>{children}</>;
}

export function DashboardShell({
  children,
  clerkUser,
  italiannoClass,
}: {
  children: ReactNode;
  clerkUser: { username: string; fullName: string; imageUrl: string; firstName: string };
  italiannoClass: string;
}) {
  return (
    <DashboardProvider clerkUser={clerkUser}>
      <FontContext.Provider value={italiannoClass}>
        <ThemeApplicator>{children}</ThemeApplicator>
      </FontContext.Provider>
    </DashboardProvider>
  );
}
