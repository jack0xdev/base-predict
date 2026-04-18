"use client";

import { useState, useCallback } from "react";
import { useAccount, useConnect, useSignMessage, useDisconnect } from "wagmi";
import { SiweMessage } from "siwe";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { injected } from "wagmi/connectors";
import { StreakBadge } from "./StreakBadge";

interface SignInButtonProps {
  /** Current session address from server, null if not authed */
  sessionAddress: string | null;
  streak?: number;
  onAuthChange?: () => void;
}

export function SignInButton({ sessionAddress, streak = 0, onAuthChange }: SignInButtonProps) {
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { disconnectAsync } = useDisconnect();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const truncate = (addr: string) =>
    `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  const signIn = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: ensure wallet connected
      let walletAddress = address;
      if (!isConnected || !walletAddress) {
        const result = await connectAsync({ connector: injected() });
        walletAddress = result.accounts[0];
      }
      if (!walletAddress) throw new Error("No wallet address");

      // Step 2: get nonce from server
      const nonceRes = await fetch("/api/auth/nonce");
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();

      // Step 3: create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address: walletAddress,
        statement: "Sign in to Base Predict",
        uri: window.location.origin,
        version: "1",
        chainId: 8453, // Base mainnet
        nonce,
      });
      const messageStr = message.prepareMessage();

      // Step 4: sign message
      const signature = await signMessageAsync({ message: messageStr });

      // Step 5: verify on server
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageStr, signature }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Verification failed");
      }

      onAuthChange?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      // Don't show error for user rejection
      if (!msg.includes("rejected") && !msg.includes("denied")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, connectAsync, signMessageAsync, onAuthChange]);

  const signOut = useCallback(async () => {
    try {
      await disconnectAsync();
      // Clear server session
      await fetch("/api/auth/verify", { method: "DELETE" });
      onAuthChange?.();
    } catch {
      // Ignore
    }
  }, [disconnectAsync, onAuthChange]);

  // Authenticated state
  if (sessionAddress) {
    return (
      <div className="flex items-center gap-2">
        <StreakBadge streak={streak} size="sm" />
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-hairline">
          <div className="w-2 h-2 rounded-full bg-acid" />
          <span className="text-xs font-mono text-bone-muted tabular-nums">
            {truncate(sessionAddress)}
          </span>
        </div>
        <button
          onClick={signOut}
          className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-bone-muted hover:text-bone"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  // Unauthenticated state
  return (
    <div className="flex flex-col items-end">
      <button
        onClick={signIn}
        disabled={loading}
        className="
          flex items-center gap-2 px-4 py-2 rounded-xl
          bg-base-blue text-white font-satoshi font-700 text-sm
          hover:bg-base-blue-hover active:scale-[0.97]
          transition-all duration-200 focus-ring
          disabled:opacity-60 disabled:cursor-not-allowed
        "
        aria-label="Sign in with Ethereum"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Wallet size={16} />
        )}
        {loading ? "Signing in…" : "Sign In"}
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-1 max-w-[200px] text-right">{error}</p>
      )}
    </div>
  );
}
