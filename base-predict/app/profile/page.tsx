"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { StreakBadge } from "@/components/StreakBadge";
import { Flame, Target, Trophy, TrendingUp, Hash, Wallet } from "lucide-react";
import type { PredictionRow, UserRow } from "@/lib/supabase";

interface ProfileData {
  user: UserRow | null;
  predictions: PredictionRow[];
  todayPick: string | null;
  rank: number | null;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (res.status === 401) throw new Error("NOT_AUTHED");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    staleTime: 15_000,
    retry: false,
  });

  const isNotAuthed = error?.message === "NOT_AUTHED";
  const user = data?.user ?? null;
  const predictions = data?.predictions ?? [];
  const sessionAddress = user?.address ?? null;

  const winRate =
    user && user.total_predictions > 0
      ? ((user.total_correct / user.total_predictions) * 100).toFixed(1)
      : "0.0";

  const handleAuthChange = () => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <>
      <Header
        sessionAddress={sessionAddress}
        streak={user?.streak ?? 0}
        onAuthChange={handleAuthChange}
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 md:py-16">
        {isNotAuthed ? (
          /* Not signed in */
          <div className="text-center py-20">
            <Wallet size={40} className="mx-auto mb-4 text-bone-muted opacity-40" />
            <h1 className="font-clash font-700 text-3xl text-bone mb-2">Your Profile</h1>
            <p className="text-bone-muted font-satoshi">
              Sign in with your wallet to see your stats.
            </p>
          </div>
        ) : isLoading ? (
          /* Loading skeleton */
          <div className="space-y-6">
            <div className="h-32 rounded-2xl bg-surface-2/30 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-surface-2/30 animate-pulse" />
              ))}
            </div>
          </div>
        ) : user ? (
          <>
            {/* ─── Streak hero ─── */}
            <div className="text-center mb-10 opacity-0-initial animate-fade-up">
              <div className="inline-flex flex-col items-center">
                <Flame
                  size={48}
                  className={user.streak > 0 ? "text-amber mb-2" : "text-bone-muted/30 mb-2"}
                />
                <span className="font-clash font-700 text-7xl md:text-8xl tracking-tight text-bone">
                  {user.streak}
                </span>
                <span className="text-sm text-bone-muted font-satoshi mt-1 uppercase tracking-wider">
                  Day Streak
                </span>
                {user.streak > 0 && (
                  <div className="mt-3">
                    <StreakBadge streak={user.streak} size="lg" />
                  </div>
                )}
              </div>
            </div>

            {/* ─── Stats grid ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
              {[
                {
                  icon: Target,
                  label: "Win Rate",
                  value: `${winRate}%`,
                  color: "text-acid",
                },
                {
                  icon: Hash,
                  label: "Total Picks",
                  value: user.total_predictions.toString(),
                  color: "text-base-blue",
                },
                {
                  icon: TrendingUp,
                  label: "Best Streak",
                  value: user.best_streak.toString(),
                  color: "text-amber",
                },
                {
                  icon: Trophy,
                  label: "Rank",
                  value: data?.rank ? `#${data.rank}` : "—",
                  color: "text-bone",
                },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="
                    rounded-xl border border-hairline bg-surface-1/40 p-4
                    opacity-0-initial animate-fade-up
                  "
                  style={{ animationDelay: `${i * 80 + 100}ms` }}
                >
                  <stat.icon size={16} className="text-bone-muted mb-2" />
                  <p className={`font-mono text-2xl tabular-nums font-600 ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-bone-muted font-satoshi mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* ─── Points total ─── */}
            <div
              className="
                rounded-2xl border border-hairline bg-surface-1/40 p-6 text-center mb-10
                opacity-0-initial animate-fade-up-2
              "
            >
              <p className="text-xs text-bone-muted font-satoshi uppercase tracking-wider mb-1">
                Total Points
              </p>
              <p className="font-mono text-4xl md:text-5xl tabular-nums font-600 text-bone">
                {user.total_points.toLocaleString()}
              </p>
            </div>

            {/* ─── Prediction history dots ─── */}
            <div className="opacity-0-initial animate-fade-up-3">
              <h2 className="font-clash font-600 text-xl text-bone mb-4">
                Recent Predictions
              </h2>
              {predictions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {predictions.map((p) => {
                    let dotColor = "bg-surface-3 border-bone-faint"; // pending
                    let label = "Pending";
                    if (p.correct === true) {
                      dotColor = "bg-acid/30 border-acid/40";
                      label = "Correct";
                    } else if (p.correct === false) {
                      dotColor = "bg-red-500/20 border-red-500/30";
                      label = "Wrong";
                    }

                    return (
                      <div
                        key={p.id}
                        className={`w-8 h-8 rounded-lg border ${dotColor} flex items-center justify-center transition-transform hover:scale-110`}
                        title={`${p.date}: ${label} (${p.points_awarded} pts)`}
                        aria-label={`${p.date}: ${label}`}
                      >
                        {p.correct === true && (
                          <span className="text-acid text-xs font-700">✓</span>
                        )}
                        {p.correct === false && (
                          <span className="text-red-400 text-xs font-700">✗</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-bone-muted font-satoshi">
                  No predictions yet. Head to the home page to make your first pick!
                </p>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs text-bone-muted font-satoshi">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-acid/30 border border-acid/40" /> Correct
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" /> Wrong
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-surface-3 border border-bone-faint" /> Pending
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-bone-muted font-satoshi">
            No profile data found.
          </div>
        )}
      </main>
    </>
  );
}
