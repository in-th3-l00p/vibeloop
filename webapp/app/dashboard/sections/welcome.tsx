"use client";

import { useDashboard, resolveWelcomeText } from "../dashboard-context";

export function Welcome({
  fullName,
  username,
  italiannoClass,
}: {
  fullName: string;
  username: string;
  italiannoClass: string;
}) {
  const { settings } = useDashboard();
  const firstName = fullName.split(" ")[0];

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
      {resolveWelcomeText(settings.welcomeText, { firstName, username })}
    </h1>
  );
}
