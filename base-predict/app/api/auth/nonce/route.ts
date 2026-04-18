import { NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    const nonce = generateNonce();
    session.nonce = nonce;
    await session.save();

    return NextResponse.json({ nonce });
  } catch (err) {
    console.error("[auth/nonce]", err);
    return NextResponse.json({ error: "Failed to generate nonce" }, { status: 500 });
  }
}
