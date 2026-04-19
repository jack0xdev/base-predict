import { NextRequest, NextResponse } from "next/server";
import { getSession, todayUTC } from "@/lib/session";
import { supabaseAdmin, type DailyCoinsRow } from "@/lib/supabase";
import { predictLimiter, cacheDel } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getSession();
    const address = session.address;
    if (!address) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit: 5 per minute per wallet
    const { success } = await predictLimiter.limit(address.toLowerCase());
    if (!success) {
      return NextResponse.json({ error: "Too many predictions. Try again in a minute." }, { status: 429 });
    }

    // Parse body
    const { coinAddress } = await req.json();
    if (!coinAddress || typeof coinAddress !== "string") {
      return NextResponse.json({ error: "Missing coinAddress" }, { status: 400 });
    }

    const date = todayUTC();

    // Verify the coin is one of today's options
    const { data: dayRow } = await supabaseAdmin
      .from("daily_coins")
      .select("coins, resolved")
      .eq("date", date)
      .single<Pick<DailyCoinsRow, "coins" | "resolved">>();

    if (!dayRow) {
      return NextResponse.json({ error: "No coins set for today" }, { status: 404 });
    }
    if (dayRow.resolved) {
      return NextResponse.json({ error: "Today's round is already resolved" }, { status: 400 });
    }

    const validAddresses = dayRow.coins.map((c) => c.address.toLowerCase());
    if (!validAddresses.includes(coinAddress.toLowerCase())) {
      return NextResponse.json({ error: "Invalid coin — not one of today's options" }, { status: 400 });
    }

    // Insert prediction
    const { error: insertErr } = await supabaseAdmin.from("predictions").insert({
      user_address: address,
      date,
      picked_coin: coinAddress.toLowerCase(),
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        return NextResponse.json({ error: "You already predicted today" }, { status: 409 });
      }
      console.error("[api/predict] insert error:", insertErr);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Update user stats
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("total_predictions")
      .eq("address", address)
      .single();

    if (user) {
      await supabaseAdmin
        .from("users")
        .update({ total_predictions: user.total_predictions + 1, last_seen: new Date().toISOString() })
        .eq("address", address);
    }

    // Invalidate caches
    await cacheDel("today", `profile:${address.toLowerCase()}`);

    return NextResponse.json({ ok: true, date, picked: coinAddress });
  } catch (err) {
    console.error("[api/predict]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
