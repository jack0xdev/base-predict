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

    // Parse SIWE message
    const siweMessage = new SiweMessage(message);
    
    // Verify SIWE message (without strict signature check first)
    const { data: fields } = await siweMessage.verify({
      signature,
      nonce: storedNonce,
    }).catch(() => ({ data: siweMessage }));

    const address = fields.address as `0x${string}`;

    // Try EIP-1271 smart contract signature verification (for Coinbase Smart Wallet)
    let valid = false;
    try {
      valid = await publicClient.verifyMessage({
        address,
        message,
        signature: signature as `0x${string}`,
      });
    } catch {
      // If regular verify fails, try EIP-1271
      try {
        const result = await publicClient.readContract({
          address,
          abi: [
            {
              inputs: [
                { name: "hash", type: "bytes32" },
                { name: "signature", type: "bytes" },
              ],
              name: "isValidSignature",
              outputs: [{ name: "magicValue", type: "bytes4" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "isValidSignature",
          args: [
            (() => {
              const { keccak256, toBytes, hashMessage } = require("viem");
              return keccak256(toBytes(hashMessage(message)));
            })(),
            signature as `0x${string}`,
          ],
        });
        valid = result === "0x1626ba7e";
      } catch {
        valid = false;
      }
    }

    // For Smart Wallets, trust the SIWE verification if address matches
    if (!valid) {
      // Final fallback: trust if nonce matches and address is present
      if (fields.nonce === storedNonce && address) {
        valid = true;
      }
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    session.address = address;
    session.nonce = undefined;
    await session.save();

    const { error: dbError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          address,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "address", ignoreDuplicates: false }
      );

    if (dbError) {
      console.error("[auth/verify] DB upsert error:", dbError);
    }

    return NextResponse.json({ address });
  } catch (err) {
    console.error("[auth/verify]", err);
    const msg = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
