"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { Header } from "@/components/Header";
import { CoinCard } from "@/components/CoinCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import { PriceTicker, type TickerItem } from "@/components/PriceTicker";
import { Flame, Users, Zap, X, AlertTriangle } from "lucide-react";
import { FUNDING_WALLET, PREDICT_FEE_USD } from "@/lib/constants";
import type { CoinEntry } from "@/lib/supabase";

interface TodayData {
  date: string;
  coins: (CoinEntry & { currentPrice: number; change24h: number })[];
  resolved: boolean;
  winnerAddress: string | null;
  totalPredictions: number;
  ethPrice: number;
}

interface ProfileData {
  user: {
    address?: string;
    streak: number;
    total_points: number;
    total_correct: number;
    total_predictions: number;
    best_streak: number;
  } | null;
  todayPick: string | null;
  rank: number | null;
}

export default function HomePage() {
  const queryClient = useQueryClient();
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  const [pickingCoin, setPickingCoin] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [pickStep, setPickStep] = useState<string | null>(null);

  // Confirmation popup state
  const [confirmCoin, setConfirmCoin] = useState<string | null>(null);
  const [confirmSymbol, setConfirmSymbol] = useState<string>("");

  const { sendTransactionAsync } = useSendTransaction();

  // Profile
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ProfileData | null> => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data: ProfileData = await res.json();
          if (data?.user) setSessionAddress(data.user.address ?? null);
          return data;
        }
        setSessionAddress(null);
        return null;
      } catch {
        setSessionAddress(null);
        return null;
      }
    },
    staleTime: 15_000,
    retry: false,
  });

  // Today's coins + ETH price
  const { data: todayData, isLoading } = useQuery<TodayData>({
    queryKey: ["today"],
    queryFn: async () => {
      const res = await fetch("/api/today");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const todayPick = profile?.todayPick ?? null;
  const ethPrice = todayData?.ethPrice ?? 2500;
  const feeInEth = PREDICT_FEE_USD / ethPrice;
  const feeDisplay = feeInEth.toFixed(8);

  const tickerItems: TickerItem[] =
    todayData?.coins.map((c) => ({
      symbol: c.symbol,
      price: c.currentPrice,
      change24h: c.change24h,
    })) ?? [];

  // Step 1: Show confirmation popup
  const handlePickClick = (coinAddress: string) => {
    if (!sessionAddress) {
      setPickError("Please sign in first");
      return;
    }
    const coin = todayData?.coins.find(
      (c) => c.address.toLowerCase() === coinAddress.toLowerCase()
    );
    setConfirmCoin(coinAddress);
    setConfirmSymbol(coin?.symbol ?? "");
    setPickError(null);
  };

  // Step 2: User confirms → pay + predict
  const handleConfirmPick = async () => {
    if (!confirmCoin || !sessionAddress) return;
    const coinAddress = confirmCoin;
    setConfirmCoin(null);
    setPickingCoin(coinAddress);
    setPickError(null);

    try {
      // Send ETH payment
      setPickStep("Sending $0.05 ETH fee...");
      const weiAmount = parseEther(feeInEth.toFixed(18));

      const txHash = await sendTransactionAsync({
        to: FUNDING_WALLET as `0x${string}`,
        value: weiAmount,
      });

      // Brief wait
      setPickStep("Confirming transaction...");
      await new Promise((r) => setTimeout(r, 3000));

      // Submit prediction
      setPickStep("Submitting prediction...");
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinAddress, txHash }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPickError(data.error || "Failed to submit prediction");
        return;
      }

      setPickStep(null);
      queryClient.invalidateQueries({ queryKey: ["today"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      refetchProfile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      if (!msg.includes("rejected") && !msg.includes("denied")) {
        setPickError(msg);
      }
      setPickStep(null);
    } finally {
      setPickingCoin(null);
    }
  };

  const handleAuthChange = () => {
    refetchProfile();
    queryClient.invalidateQueries({ queryKey: ["today"] });
  };

  return (
    <>
      {/* ─── Confirmation Popup ─── */}
      {confirmCoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-hairline bg-surface-1 p-6 shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setConfirmCoin(null)}
              className="absolute top-4 right-4 text-bone-muted hover:text-bone transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-amber" />
              </div>

              <h3 className="font-clash font-600 text-xl text-bone mb-2">
                Confirm Prediction
              </h3>

              <p className="text-sm text-bone-muted font-satoshi mb-4">
                You are picking <span className="text-acid font-700">{confirmSymbol}</span>. A small fee is required:
              </p>

              <div className="rounded-xl bg-surface-2 border border-hairline p-4 mb-6">
                <p className="font-mono text-2xl tabular-nums text-bone">
                  ${PREDICT_FEE_USD.toFixed(2)}
                </p>
                <p className="text-xs text-bone-muted font-mono mt-1">
                  ≈ {feeDisplay} ETH on Base
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmCoin(null)}
                  className="flex-1 py-3 rounded-xl border border-hairline bg-surface-2 text-bone-muted font-satoshi font-600 text-sm hover:bg-surface-3 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPick}
                  className="flex-1 py-3 rounded-xl bg-base-blue text-white font-satoshi font-700 text-sm hover:bg-base-blue-hover active:scale-[0.98] transition-all"
                >
                  Pay & Predict
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PriceTicker items={tickerItems} />
      <Header
        sessionAddress={sessionAddress}
        streak={profile?.user?.streak ?? 0}
        onAuthChange={handleAuthChange}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4">
        {/* Hero */}
        <section className="pt-12 md:pt-20 pb-10 md:pb-16">
          <div className="max-w-3xl">
            <h1 className="font-clash font-700 text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight text-bone opacity-0-initial animate-fade-up">
              PREDICT<span className="text-base-blue">.</span>
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg text-bone-muted font-satoshi font-400 max-w-lg leading-relaxed opacity-0-initial animate-fade-up-1">
              Pick the Base creator coin that pumps the most in 24 hours.
              Build your streak. Climb the leaderboard.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 opacity-0-initial animate-fade-up-2">
            <CountdownTimer />
            {todayData && (
              <div className="flex items-center gap-6 text-sm text-bone-muted">
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  <span className="font-mono tabular-nums">{todayData.totalPredictions.toLocaleString()}</span>
                  <span className="hidden sm:inline">predictions</span>
                </span>
                {profile?.user && profile.user.streak > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Flame size={14} className="text-amber" />
                    <span className="font-mono tabular-nums">{profile.user.streak}</span>
                    day streak
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Fee notice */}
        <div className="mb-6 opacity-0-initial animate-fade-up-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-1/60 border border-hairline text-sm text-bone-muted">
            <span className="text-acid font-mono font-600">${PREDICT_FEE_USD.toFixed(2)}</span>
            <span className="font-satoshi">fee per prediction</span>
            <span className="text-bone-muted/50">•</span>
            <span className="font-mono text-xs tabular-nums">{feeDisplay} ETH</span>
          </div>
        </div>

        {/* Coin Cards */}
        <section className="pb-16 md:pb-24" aria-label="Today's coins">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-hairline bg-surface-1/40 h-64 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : todayData?.coins ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {todayData.coins.map((coin, i) => (
                  <CoinCard
                    key={coin.address}
                    coin={coin}
                    currentPrice={coin.currentPrice}
                    change24h={coin.change24h}
                    isPicked={todayPick?.toLowerCase() === coin.address.toLowerCase()}
                    isLocked={!!todayPick}
                    onPick={handlePickClick}
                    loading={pickingCoin === coin.address}
                    index={i}
                  />
                ))}
              </div>

              {pickStep && (
                <div className="mt-4 p-3 rounded-xl bg-base-blue/10 border border-base-blue/20 text-base-blue text-sm font-satoshi text-center flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-base-blue/30 border-t-base-blue rounded-full animate-spin" />
                  {pickStep}
                </div>
              )}

              {pickError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-satoshi text-center">
                  {pickError}
                </div>
              )}

              {todayPick && (
                <div className="mt-6 text-center opacity-0-initial animate-fade-up">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-acid/10 border border-acid/20">
                    <Zap size={16} className="text-acid" />
                    <span className="text-sm font-satoshi font-500 text-acid">
                      Prediction locked! Results at 00:00 UTC.
                    </span>
                  </div>
                </div>
              )}

              {!sessionAddress && !isLoading && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-bone-muted font-satoshi">
                    Sign in with your wallet to make a prediction.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-bone-muted font-satoshi">
                No coins set for today. The daily round will start at 00:00 UTC.
              </p>
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="pb-16 md:pb-24 border-t border-hairline pt-12">
          <h2 className="font-clash font-600 text-2xl md:text-3xl text-bone mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { step: "01", title: "Pick a coin", desc: "Every day, three trending Base coins are selected. Choose the one you think will pump the most. A $0.05 ETH fee is required." },
              { step: "02", title: "Wait 24 hours", desc: "Prices are tracked from the start. At midnight UTC, the coin with the highest percentage gain wins." },
              { step: "03", title: "Build your streak", desc: "Correct picks earn 100 points + streak bonuses. Consecutive wins multiply your rewards up to 2x." },
            ].map((item, i) => (
              <div key={item.step} className="opacity-0-initial animate-fade-up" style={{ animationDelay: `${i * 100 + 200}ms` }}>
                <span className="font-mono text-xs text-base-blue tabular-nums">{item.step}</span>
                <h3 className="font-clash font-600 text-lg text-bone mt-1 mb-2">{item.title}</h3>
                <p className="text-sm text-bone-muted font-satoshi leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-bone-muted">
          <span className="font-satoshi">Built on <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="text-base-blue hover:underline">Base</a></span>
          <span className="font-satoshi">Prices via <a href="https://dexscreener.com" target="_blank" rel="noopener noreferrer" className="text-bone hover:underline">DexScreener</a></span>
        </div>
      </footer>
    </>
  );
}
