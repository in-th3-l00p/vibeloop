"use client";

import { useDashboard } from "../dashboard-context";
import { useFont } from "../dashboard-shell";
import { resolveWelcomeText } from "../lib/theme-utils";

export function Welcome() {
  const { settings, user } = useDashboard();
  const italiannoClass = useFont();

  return (
    <h1
      className={`${italiannoClass} text-6xl md:text-8xl text-center leading-none`}
      style={{
        color: settings.titleColor,
        textShadow: settings.glowEffects
          ? `0 0 30px ${settings.titleColor}40, 0 0 60px ${settings.titleColor}15`
          : undefined,
      }}
    >
      {resolveWelcomeText(settings.welcomeText, { firstName: user.firstName, username: user.username })}
    </h1>
  );
}
