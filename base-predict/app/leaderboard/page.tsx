"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { LeaderboardTable, type LeaderboardEntry } from "@/components/LeaderboardTable";
import { Trophy, RefreshCw } from "lucide-react";

export default function LeaderboardPage() {
  const queryClient = useQueryClient();
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  // Check auth
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setSessionAddress(data.user.address ?? null);
          setStreak(data.user.streak ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  const { data, isLoading, refetch, isFetching } = useQuery<{
    entries: LeaderboardEntry[];
  }>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const handleAuthChange = () => {
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  };

  return (
    <>
      <Header
        sessionAddress={sessionAddress}
        streak={streak}
        onAuthChange={handleAuthChange}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 md:py-16">
        {/* Title */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy size={24} className="text-amber" />
              <h1 className="font-clash font-700 text-4xl md:text-5xl tracking-tight text-bone">
                Leaderboard
              </h1>
            </div>
            <p className="text-sm text-bone-muted font-satoshi">
              Top 100 predictors by total points
            </p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors text-bone-muted hover:text-bone disabled:opacity-40"
            aria-label="Refresh leaderboard"
          >
            <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-hairline bg-surface-1/40 overflow-hidden">
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 border-b border-hairline/50 animate-pulse bg-surface-2/20"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          ) : (
            <LeaderboardTable
              entries={data?.entries ?? []}
              currentUser={sessionAddress}
            />
          )}
        </div>
      </main>
    </>
  );
}
