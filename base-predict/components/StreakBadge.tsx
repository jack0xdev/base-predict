"use client";

import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  if (streak < 1) return null;

  const sizeMap = {
    sm: { icon: 14, text: "text-xs", px: "px-2 py-0.5" },
    md: { icon: 16, text: "text-sm", px: "px-2.5 py-1" },
    lg: { icon: 20, text: "text-base", px: "px-3 py-1.5" },
  };
  const s = sizeMap[size];

  const isHot = streak >= 7;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-satoshi font-700 ${s.px} ${s.text} ${
        isHot ? "bg-amber/20 text-amber animate-pulse-glow" : "bg-surface-2 text-bone-muted"
      }`}
      aria-label={`${streak} day streak`}
    >
      <Flame size={s.icon} className={isHot ? "text-amber" : "text-bone-muted"} />
      {streak}
    </span>
  );
}
