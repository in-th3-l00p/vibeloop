"use client";

import { forwardRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

export const ActionButton = forwardRef<
  HTMLButtonElement,
  { icon: Parameters<typeof HugeiconsIcon>[0]["icon"]; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ icon, label, ...props }, ref) => (
  <button
    ref={ref}
    className="cursor-pointer flex flex-col items-center gap-2 rounded-lg bg-card ring-1 ring-border py-4 text-muted-foreground transition-all duration-300 hover:text-white"
    {...props}
  >
    <HugeiconsIcon icon={icon} size={22} />
    <span className="text-[11px] uppercase tracking-wider">{label}</span>
  </button>
));

ActionButton.displayName = "ActionButton";
