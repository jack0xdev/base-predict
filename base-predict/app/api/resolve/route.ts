import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type DailyCoinsRow, type PredictionRow } from "@/lib/supabase";
import { fetchCoinPrices } from "@/lib/dexscreener";
import { CANDIDATES } from "@/lib/coins";
import { todayUTC, yesterdayUTC } from "@/lib/session";
import { cacheDel } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Core resolve logic.
 * Picks top 3 Base App creator coins by 24h volume.
 */
export async function runResolve(authHeader: string | null, internal = false): Promise<{ ok: boolean; results: string[] }> {
  if (!internal) {
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
    if (!authHeader || authHeader !== expectedToken) {
      return { ok: false, results: ["Unauthorized"] };
    }
  }

  const results: string[] = [];

  try {
    // ─── Step 1: Resolve yesterday ───
    const yesterday = yesterdayUTC();
    const { data: yesterdayRow } = await supabaseAdmin
      .from("daily_coins").select("*").eq("date", yesterday).single<DailyCoinsRow>();

    if (yesterdayRow && !yesterdayRow.resolved) {
      const addresses = yesterdayRow.coins.map((c) => c.address);
      const priceMap = await fetchCoinPrices(addresses);

      const changes = yesterdayRow.coins.map((coin) => {
        const pair = priceMap.get(coin.address.toLowerCase());
        const currentPrice = pair ? parseFloat(pair.priceUsd) : coin.startPrice;
        const pctChange = coin.startPrice > 0
          ? ((currentPrice - coin.startPrice) / coin.startPrice) * 100
          : 0;
        return { address: coin.address.toLowerCase(), pctChange };
      });

      changes.sort((a, b) => b.pctChange - a.pctChange);
      const winner = changes[0];
      results.push(`Winner: ${winner.address} (+${winner.pctChange.toFixed(2)}%)`);

      await supabaseAdmin.from("daily_coins").update({
        resolved: true, winner_address: winner.address, resolved_at: new Date().toISOString(),
      }).eq("date", yesterday);

      const { data: predictions } = await supabaseAdmin
        .from("predictions").select("*").eq("date", yesterday);

      if (predictions && predictions.length > 0) {
        for (const pred of predictions as PredictionRow[]) {
          const isCorrect = pred.picked_coin.toLowerCase() === winner.address;
          const { data: user } = await supabaseAdmin
            .from("users").select("streak, best_streak, total_points, total_correct")
            .eq("address", pred.user_address).single();

          let pointsAwarded = 0;
          let newStreak = 0;
          if (isCorrect && user) {
            newStreak = user.streak + 1;
            pointsAwarded = 100 + Math.min(newStreak * 10, 100);
          }

          await supabaseAdmin.from("predictions").update({
            correct: isCorrect, points_awarded: pointsAwarded,
          }).eq("id", pred.id);

          if (user) {
            await supabaseAdmin.from("users").update({
              streak: newStreak,
              best_streak: Math.max(user.best_streak, newStreak),
              total_points: user.total_points + pointsAwarded,
              total_correct: user.total_correct + (isCorrect ? 1 : 0),
            }).eq("address", pred.user_address);
          }
        }
        results.push(`Processed ${predictions.length} predictions`);
      }
    } else if (yesterdayRow?.resolved) {
      results.push("Yesterday already resolved");
    } else {
      results.push("No yesterday data — skipping");
    }

    // ─── Step 2: Pick today's top 3 creator coins by volume ───
    const today = todayUTC();
    const { data: existingToday } = await supabaseAdmin
      .from("daily_coins").select("date").eq("date", today).single();

    if (!existingToday) {
      // Fetch live data for ALL creator coins in our list
      const allAddresses = CANDIDATES.map((c) => c.address);
      const priceMap = await fetchCoinPrices(allAddresses);

      // Build list with volume data, filter out dead coins
      const coinsWithVolume = CANDIDATES
        .map((coin) => {
          const pair = priceMap.get(coin.address.toLowerCase());
          return {
            ...coin,
            address: coin.address.toLowerCase(),
            priceUsd: pair ? parseFloat(pair.priceUsd) : 0,
            volume24h: pair?.volume?.h24 ?? 0,
            liquidity: pair?.liquidity?.usd ?? 0,
          };
        })
        .filter((c) => c.priceUsd > 0 && c.volume24h > 0); // Only active coins

      // Sort by 24h volume — top 3 most active creator coins
      coinsWithVolume.sort((a, b) => b.volume24h - a.volume24h);
      const top3 = coinsWithVolume.slice(0, 3);

      if (top3.length < 3) {
        // Fallback: if less than 3 have volume, fill with random from candidates
        const used = new Set(top3.map((c) => c.address));
        const remaining = CANDIDATES.filter((c) => !used.has(c.address.toLowerCase()));
        while (top3.length < 3 && remaining.length > 0) {
          const idx = Math.floor(Math.random() * remaining.length);
          const coin = remaining[idx];
          const pair = priceMap.get(coin.address.toLowerCase());
          top3.push({
            ...coin,
            address: coin.address.toLowerCase(),
            priceUsd: pair ? parseFloat(pair.priceUsd) : 0,
            volume24h: 0,
            liquidity: 0,
          });
          remaining.splice(idx, 1);
        }
      }

      const coinsForDb = top3.map((c) => ({
        address: c.address,
        symbol: c.symbol,
        name: c.name,
        startPrice: c.priceUsd,
        imageUrl: c.imageUrl,
      }));

      const { error: insertErr } = await supabaseAdmin.from("daily_coins").insert({
        date: today, coins: coinsForDb,
      });

      if (insertErr) {
        results.push(`Error: ${insertErr.message}`);
      } else {
        results.push(`Today's top coins: ${coinsForDb.map((c) => `${c.symbol} ($${c.startPrice.toFixed(6)})`).join(", ")}`);
      }
    } else {
      results.push("Today's coins already set");
    }

    await cacheDel("today", "leaderboard:top100");
    results.push("Cache invalidated");

    return { ok: true, results };
  } catch (err) {
    console.error("[resolve]", err);
    return { ok: false, results: ["Internal error"] };
  }
}

export async function POST(req: NextRequest) {
  const result = await runResolve(req.headers.get("authorization"));
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}

export async function GET(req: NextRequest) {
  const result = await runResolve(req.headers.get("authorization"));
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
