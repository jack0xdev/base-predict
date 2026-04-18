import { NextRequest, NextResponse } from "next/server";
import { getSession, todayUTC } from "@/lib/session";
import { supabase, type UserRow, type PredictionRow } from "@/lib/supabase";
import { cacheGet, cacheSet, readLimiter } from "@/lib/redis";

export const runtime = "nodejs";

interface ProfileResponse {
  user: UserRow | null;
  predictions: PredictionRow[];
  todayPick: string | null;
  rank: number | null;
}

export async function GET(req: NextRequest) {
  try {
    // Rate limit
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success } = await readLimiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    // Auth check
    const session = await getSession();
    const address = session.address;
    if (!address) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const cacheKey = `profile:${address.toLowerCase()}`;

    // Cache check
    const cached = await cacheGet<ProfileResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch user row
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("address", address)
      .single<UserRow>();

    // Fetch last 30 predictions
    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_address", address)
      .order("date", { ascending: false })
      .limit(30);

    // Today's pick
    const todayPrediction = (predictions ?? []).find((p) => p.date === todayUTC());
    const todayPick = todayPrediction?.picked_coin ?? null;

    // Calculate rank
    let rank: number | null = null;
    if (user) {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gt("total_points", user.total_points);
      rank = (count ?? 0) + 1;
    }

    const response: ProfileResponse = {
      user,
      predictions: predictions ?? [],
      todayPick,
      rank,
    };

    await cacheSet(cacheKey, response, 30);

    return NextResponse.json(response);
  } catch (err) {
    console.error("[api/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
