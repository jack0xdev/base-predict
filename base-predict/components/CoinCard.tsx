"use client";

import { Check, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { type CoinEntry } from "@/lib/supabase";

interface CoinCardProps {
  coin: CoinEntry;
  currentPrice?: number;
  change24h?: number;
  isPicked: boolean;
  isLocked: boolean;
  onPick: (address: string) => void;
  loading?: boolean;
  index: number;
}

export function CoinCard({
  coin,
  currentPrice,
  change24h,
  isPicked,
  isLocked,
  onPick,
  loading,
  index,
}: CoinCardProps) {
  const isPositive = (change24h ?? 0) >= 0;
  const disabled = isLocked || loading;

  return (
    <div
      className={`
        opacity-0-initial animate-fade-up relative group
        rounded-2xl border transition-all duration-300
        ${isPicked
          ? "border-acid/40 bg-acid/5 shadow-[0_0_40px_rgba(212,255,58,0.08)]"
          : "border-hairline bg-surface-1/60 hover-lift"
        }
        ${isLocked && !isPicked ? "opacity-50 pointer-events-none" : ""}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Coin header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Coin image with fallback */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-surface-2 border border-hairline flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coin.imageUrl}
                alt={coin.symbol}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {/* Fallback letter */}
              <span className="absolute inset-0 flex items-center justify-center text-lg font-clash font-600 text-bone-muted">
                {coin.symbol[0]}
              </span>
            </div>
            <div>
              <h3 className="font-clash font-600 text-lg text-bone leading-tight">
                {coin.symbol}
              </h3>
              <p className="text-xs text-bone-muted font-satoshi mt-0.5">{coin.name}</p>
            </div>
          </div>

          {/* External link to DexScreener instead of Base App coin page */}
          <a
            href={`https://dexscreener.com/base/${coin.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bone-muted hover:text-base-blue transition-colors p-1"
            aria-label={`View ${coin.symbol} on DexScreener`}
          >
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Price display */}
        <div className="space-y-1">
          <p className="font-mono text-2xl tabular-nums text-bone tracking-tight">
            {currentPrice != null && currentPrice > 0
              ? `$${currentPrice < 0.01
                  ? currentPrice.toFixed(6)
                  : currentPrice < 1
                    ? currentPrice.toFixed(4)
                    : currentPrice.toFixed(2)
                }`
              : "Loading…"
            }
          </p>
          {change24h != null && (
            <div className={`flex items-center gap-1 text-sm font-mono tabular-nums ${isPositive ? "text-acid" : "text-red-400"}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{isPositive ? "+" : ""}{change24h.toFixed(2)}%</span>
              <span className="text-bone-muted text-xs ml-1">24h</span>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-bone-faint mx-5" />

      {/* Action area */}
      <div className="p-5 pt-4">
        {isPicked ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-acid/10 border border-acid/20">
            <Check size={18} className="text-acid" />
            <span className="font-satoshi font-700 text-acid text-sm uppercase tracking-wider">
              Your Pick
            </span>
          </div>
        ) : (
          <button
            onClick={() => onPick(coin.address)}
            disabled={disabled}
            className={`
              w-full py-3 rounded-xl font-satoshi font-700 text-sm uppercase tracking-wider
              transition-all duration-200
              ${disabled
                ? "bg-surface-2 text-bone-muted cursor-not-allowed"
                : "bg-base-blue text-white hover:bg-base-blue-hover active:scale-[0.98] focus-ring"
              }
            `}
            aria-label={`Pick ${coin.symbol}`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </span>
            ) : (
              "Pick This Coin"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
