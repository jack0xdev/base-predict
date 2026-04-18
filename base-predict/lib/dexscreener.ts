/**
 * DexScreener public API — no key required.
 */

export interface DexPairData {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  priceChange: {
    h24: number;
  };
  volume: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
  info?: {
    imageUrl?: string;
  };
}

interface DexScreenerResponse {
  pairs: DexPairData[] | null;
}

const BASE_URL = "https://api.dexscreener.com/latest/dex";

/**
 * Fetch best pair for a single token on Base chain.
 */
export async function fetchCoinPrice(tokenAddress: string): Promise<DexPairData | null> {
  try {
    const res = await fetch(`${BASE_URL}/tokens/${tokenAddress}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data: DexScreenerResponse = await res.json();
    if (!data.pairs?.length) return null;
    const basePairs = data.pairs.filter((p) => p.chainId === "base");
    if (!basePairs.length) return null;
    return basePairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
  } catch {
    return null;
  }
}

/**
 * Fetch prices for multiple tokens in parallel.
 */
export async function fetchCoinPrices(
  tokenAddresses: string[]
): Promise<Map<string, DexPairData>> {
  const results = new Map<string, DexPairData>();
  try {
    const joined = tokenAddresses.join(",");
    const res = await fetch(`${BASE_URL}/tokens/${joined}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return results;
    const data: DexScreenerResponse = await res.json();
    if (!data.pairs?.length) return results;
    const basePairs = data.pairs.filter((p) => p.chainId === "base");
    for (const pair of basePairs) {
      const addr = pair.baseToken.address.toLowerCase();
      const existing = results.get(addr);
      if (!existing || (pair.liquidity?.usd ?? 0) > (existing.liquidity?.usd ?? 0)) {
        results.set(addr, pair);
      }
    }
  } catch {
    // Return whatever we have
  }
  return results;
}

/**
 * Fetch current ETH price in USD from DexScreener (WETH on Base).
 */
export async function fetchEthPrice(): Promise<number> {
  try {
    // WETH on Base
    const wethAddress = "0x4200000000000000000000000000000000000006";
    const res = await fetch(`${BASE_URL}/tokens/${wethAddress}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return 2500; // fallback
    const data: DexScreenerResponse = await res.json();
    if (!data.pairs?.length) return 2500;
    const basePair = data.pairs.find((p) => p.chainId === "base" && parseFloat(p.priceUsd) > 100);
    if (basePair) return parseFloat(basePair.priceUsd);
    return 2500;
  } catch {
    return 2500; // fallback
  }
}

/**
 * Fetch trending / top tokens on Base chain by 24h volume.
 * Returns top tokens with decent liquidity.
 */
export async function fetchTrendingBaseCoins(): Promise<{
  address: string;
  symbol: string;
  name: string;
  imageUrl: string;
  priceUsd: number;
  volume24h: number;
}[]> {
  try {
    // Search for popular Base tokens using DexScreener search
    const searches = ["base meme", "base trending", "base defi"];
    const allPairs: DexPairData[] = [];

    for (const query of searches) {
      try {
        const res = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
          { next: { revalidate: 300 } }
        );
        if (res.ok) {
          const data: DexScreenerResponse = await res.json();
          if (data.pairs) {
            allPairs.push(...data.pairs);
          }
        }
      } catch {
        // continue
      }
    }

    // Filter: Base chain, >$10k liquidity, >$5k volume
    const basePairs = allPairs.filter(
      (p) =>
        p.chainId === "base" &&
        (p.liquidity?.usd ?? 0) > 10_000 &&
        (p.volume?.h24 ?? 0) > 5_000
    );

    // Deduplicate by token address, keep highest volume pair
    const tokenMap = new Map<string, DexPairData>();
    for (const pair of basePairs) {
      const addr = pair.baseToken.address.toLowerCase();
      // Skip WETH, stablecoins
      if (addr === "0x4200000000000000000000000000000000000006") continue;
      if (["USDC", "USDT", "DAI", "USDbC"].includes(pair.baseToken.symbol)) continue;

      const existing = tokenMap.get(addr);
      if (!existing || (pair.volume?.h24 ?? 0) > (existing.volume?.h24 ?? 0)) {
        tokenMap.set(addr, pair);
      }
    }

    // Sort by 24h volume, take top results
    const sorted = Array.from(tokenMap.values())
      .sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0))
      .slice(0, 20);

    return sorted.map((p) => ({
      address: p.baseToken.address.toLowerCase(),
      symbol: p.baseToken.symbol,
      name: p.baseToken.name,
      imageUrl: `https://dd.dexscreener.com/ds-data/tokens/base/${p.baseToken.address.toLowerCase()}.png`,
      priceUsd: parseFloat(p.priceUsd),
      volume24h: p.volume?.h24 ?? 0,
    }));
  } catch {
    return [];
  }
}
