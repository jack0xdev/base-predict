"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function getTimeLeft() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();

  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);

  return { h, m, s, total: diff };
}

export function CountdownTimer() {
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1_000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-3" aria-label="Time until next resolve">
      <Clock size={18} className="text-bone-muted" />
      <div className="flex items-baseline gap-1 font-mono text-2xl tracking-tight tabular-nums">
        <span className="text-bone">{pad(time.h)}</span>
        <span className="text-bone-faint animate-count-pulse">:</span>
        <span className="text-bone">{pad(time.m)}</span>
        <span className="text-bone-faint animate-count-pulse">:</span>
        <span className="text-bone">{pad(time.s)}</span>
      </div>
      <span className="text-xs text-bone-muted font-satoshi uppercase tracking-widest">
        UTC
      </span>
    </div>
  );
}
