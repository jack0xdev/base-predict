import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    if (!message || !signature) {
      return NextResponse.json({ error: "Missing message or signature" }, { status: 400 });
    }

    const session = await getSession();
    const storedNonce = session.nonce;
    if (!storedNonce) {
      return NextResponse.json({ error: "No nonce in session — call /api/auth/nonce first" }, { status: 401 });
    }

    // Parse and verify SIWE message
    const siweMessage = new SiweMessage(message);
    const { data: fields } = await siweMessage.verify({
      signature,
      nonce: storedNonce,
    });

    // Additional on-chain signature verification via viem
    const valid = await publicClient.verifyMessage({
      address: fields.address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Save address to session, clear nonce
    session.address = fields.address;
    session.nonce = undefined;
    await session.save();

    // Upsert user in Supabase (create if new, update last_seen)
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          address: fields.address,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "address", ignoreDuplicates: false }
      );

    if (dbError) {
      console.error("[auth/verify] DB upsert error:", dbError);
      // Non-fatal: user is still authenticated even if DB write fails
    }

    return NextResponse.json({ address: fields.address });
  } catch (err) {
    console.error("[auth/verify]", err);
    const msg = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

/** DELETE — sign out (destroy session) */
export async function DELETE() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
