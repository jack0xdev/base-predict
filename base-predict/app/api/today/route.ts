import { NextRequest, NextResponse } from "next/server";
import { supabase, type DailyCoinsRow, type CoinEntry } from "@/lib/supabase";
import { cacheGet, cacheSet, readLimiter } from "@/lib/redis";
import { fetchCoinPrices, fetchEthPrice } from "@/lib/dexscreener";
import { todayUTC } from "@/lib/session";
import { runResolve } from "@/app/api/resolve/route";

export const runtime = "nodejs";
export const revalidate = 60;

interface TodayResponse {
  date: string;
  coins: (CoinEntry & { currentPrice: number; change24h: number })[];
  resolved: boolean;
  winnerAddress: string | null;
  totalPredictions: number;
  ethPrice: number;
}

const CACHE_KEY = "today";
const CACHE_TTL = 60;

export async function GET(req: NextRequest) {
  try {
    // Rate limit
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success } = await readLimiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    // Cache check
    const cached = await cacheGet<TodayResponse>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
      });
    }

    const date = todayUTC();
    let row: DailyCoinsRow | null = null;

    // Fetch from DB
    const { data, error } = await supabase
      .from("daily_coins").select("*").eq("date", date).single<DailyCoinsRow>();

    if (error || !data) {
      // Auto-resolve: no coins for today, trigger resolve internally
      const resolveResult = await runResolve(null, true);
      console.log("[today] Auto-resolved:", resolveResult.results);

      // Try fetching again
      const { data: retryData } = await supabase
        .from("daily_coins").select("*").eq("date", date).single<DailyCoinsRow>();

      if (!retryData) {
        return NextResponse.json(
          { error: "Could not set up today's coins. Try again." },
          { status: 404 }
        );
      }
      row = retryData;
    } else {
      row = data;
    }

    // Fetch live prices
    const addresses = row.coins.map((c) => c.address);
    const priceMap = await fetchCoinPrices(addresses);

    const coins = row.coins.map((coin) => {
      const pair = priceMap.get(coin.address.toLowerCase());
      return {
        ...coin,
        currentPrice: pair ? parseFloat(pair.priceUsd) : coin.startPrice,
        change24h: pair?.priceChange?.h24 ?? 0,
      };
    });

    // Count predictions
    const { count } = await supabase
      .from("predictions")
      .select("*", { count: "exact", head: true })
      .eq("date", date);

    // Fetch ETH price for fee calculation
    const ethPrice = await fetchEthPrice();

    const response: TodayResponse = {
      date: row.date,
      coins,
      resolved: row.resolved,
      winnerAddress: row.winner_address,
      totalPredictions: count ?? 0,
      ethPrice,
    };

    await cacheSet(CACHE_KEY, response, CACHE_TTL);

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("[api/today]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
