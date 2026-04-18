"use client";

import { Trophy } from "lucide-react";
import { StreakBadge } from "./StreakBadge";

export interface LeaderboardEntry {
  address: string;
  total_points: number;
  streak: number;
  total_correct: number;
  total_predictions: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUser?: string | null;
}

const RANK_STYLES: Record<number, string> = {
  1: "text-amber border-l-2 border-amber/50 bg-amber/5",
  2: "text-bone/80 border-l-2 border-bone/20 bg-bone/[0.03]",
  3: "text-orange-400 border-l-2 border-orange-400/30 bg-orange-400/[0.03]",
};

const RANK_ICONS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function LeaderboardTable({ entries, currentUser }: LeaderboardTableProps) {
  const truncate = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  if (!entries.length) {
    return (
      <div className="text-center py-16 text-bone-muted">
        <Trophy size={32} className="mx-auto mb-3 opacity-40" />
        <p className="font-satoshi text-sm">No predictions yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" aria-label="Leaderboard">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="py-3 px-4 text-xs font-satoshi font-500 text-bone-muted uppercase tracking-wider w-16">
              Rank
            </th>
            <th className="py-3 px-4 text-xs font-satoshi font-500 text-bone-muted uppercase tracking-wider">
              Player
            </th>
            <th className="py-3 px-4 text-xs font-satoshi font-500 text-bone-muted uppercase tracking-wider text-right">
              Streak
            </th>
            <th className="py-3 px-4 text-xs font-satoshi font-500 text-bone-muted uppercase tracking-wider text-right hidden sm:table-cell">
              W / L
            </th>
            <th className="py-3 px-4 text-xs font-satoshi font-500 text-bone-muted uppercase tracking-wider text-right">
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isCurrentUser = currentUser?.toLowerCase() === entry.address.toLowerCase();
            const rankStyle = RANK_STYLES[rank] ?? "";

            return (
              <tr
                key={entry.address}
                className={`
                  border-b border-hairline/50 transition-colors
                  ${rankStyle}
                  ${isCurrentUser ? "!bg-base-blue/10 !border-l-2 !border-base-blue" : "hover:bg-surface-2/30"}
                `}
              >
                {/* Rank */}
                <td className="py-3 px-4">
                  <span className="font-mono text-sm tabular-nums">
                    {RANK_ICONS[rank] ?? `#${rank}`}
                  </span>
                </td>

                {/* Address */}
                <td className="py-3 px-4">
                  <a
                    href={`https://base.app/profile/${entry.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm tabular-nums text-bone hover:text-base-blue transition-colors"
                  >
                    {truncate(entry.address)}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs font-satoshi text-base-blue">(you)</span>
                    )}
                  </a>
                </td>

                {/* Streak */}
                <td className="py-3 px-4 text-right">
                  <StreakBadge streak={entry.streak} size="sm" />
                </td>

                {/* W / L */}
                <td className="py-3 px-4 text-right hidden sm:table-cell">
                  <span className="font-mono text-sm tabular-nums text-bone-muted">
                    {entry.total_correct} / {entry.total_predictions - entry.total_correct}
                  </span>
                </td>

                {/* Points */}
                <td className="py-3 px-4 text-right">
                  <span className="font-mono text-sm tabular-nums font-600 text-bone">
                    {entry.total_points.toLocaleString()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
