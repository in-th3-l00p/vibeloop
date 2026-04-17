"use client";

import { motion } from "motion/react";
import { useDashboard } from "../dashboard-context";
import { useFont } from "../dashboard-shell";
import { resolveWelcomeText } from "../lib/theme-utils";

export function Welcome() {
  const { settings, user } = useDashboard();
  const italiannoClass = useFont();

  return (
    <motion.h1
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`${italiannoClass} text-6xl md:text-8xl text-center leading-none`}
      style={{
        color: settings.titleColor,
        textShadow: settings.glowEffects
          ? `0 0 30px ${settings.titleColor}40, 0 0 60px ${settings.titleColor}15`
          : undefined,
      }}
    >
      {resolveWelcomeText(settings.welcomeText, { firstName: user.firstName, username: user.username })}
    </motion.h1>
  );
}
