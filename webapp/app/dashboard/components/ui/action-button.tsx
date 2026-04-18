"use client";

import { forwardRef } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";

export const ActionButton = forwardRef<
  HTMLButtonElement,
  { icon: Parameters<typeof HugeiconsIcon>[0]["icon"]; label: string; onClick?: () => void; className?: string }
>(({ icon, label, onClick, className }, ref) => (
  <motion.button
    ref={ref}
    onClick={onClick}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
    className={`w-full cursor-pointer flex flex-col items-center gap-2 rounded-lg bg-card ring-1 ring-border py-4 text-muted-foreground transition-colors duration-300 hover:text-white ${className ?? ""}`}
  >
    <HugeiconsIcon icon={icon} size={22} />
    <span className="text-[11px] uppercase tracking-wider">{label}</span>
  </motion.button>
));

ActionButton.displayName = "ActionButton";
