"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

export interface TickerItem {
  symbol: string;
  price: number;
  change24h: number;
}

interface PriceTickerProps {
  items: TickerItem[];
}

function TickerEntry({ item }: { item: TickerItem }) {
  const positive = item.change24h >= 0;
  const priceStr =
    item.price < 0.01
      ? item.price.toFixed(6)
      : item.price < 1
        ? item.price.toFixed(4)
        : item.price.toFixed(2);

  return (
    <span className="inline-flex items-center gap-2 px-5 whitespace-nowrap">
      <span className="font-satoshi font-700 text-xs text-bone">{item.symbol}</span>
      <span className="font-mono text-xs tabular-nums text-bone-muted">${priceStr}</span>
      <span
        className={`inline-flex items-center gap-0.5 font-mono text-xs tabular-nums ${
          positive ? "text-acid" : "text-red-400"
        }`}
      >
        {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {positive ? "+" : ""}
        {item.change24h.toFixed(1)}%
      </span>
    </span>
  );
}

export function PriceTicker({ items }: PriceTickerProps) {
  if (!items.length) return null;

  // Duplicate items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden border-b border-hairline bg-surface-0/80 backdrop-blur-sm"
      aria-label="Live coin prices"
    >
      <div className="marquee-track py-2.5">
        {doubled.map((item, i) => (
          <TickerEntry key={`${item.symbol}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
