import { NextRequest, NextResponse } from "next/server";
import { supabase, type UserRow } from "@/lib/supabase";
import { cacheGet, cacheSet, readLimiter } from "@/lib/redis";

export const runtime = "nodejs";
export const revalidate = 60;

const CACHE_KEY = "leaderboard:top100";
const CACHE_TTL = 60;

export async function GET(req: NextRequest) {
  try {
    // Rate limit
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success } = await readLimiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    // Cache
    const cached = await cacheGet<UserRow[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ entries: cached }, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
      });
    }

    // DB query — top 100 by total_points descending
    const { data, error } = await supabase
      .from("users")
      .select("address, total_points, streak, best_streak, total_correct, total_predictions")
      .order("total_points", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[api/leaderboard]", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const entries = data ?? [];
    await cacheSet(CACHE_KEY, entries, CACHE_TTL);

    return NextResponse.json({ entries }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("[api/leaderboard]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
