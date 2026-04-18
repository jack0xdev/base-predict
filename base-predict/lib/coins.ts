/**
 * BASE APP CREATOR COINS — real creator coins from base.app
 */

export interface CoinCandidate {
  address: string;
  symbol: string;
  name: string;
  imageUrl: string;
}

export const CANDIDATES: CoinCandidate[] = [
  // ─── Real Base App Creator Coins ───
  {
    address: "0x0578d8a44db98b23bf096a382e016e29a5ce0ffe",
    symbol: "HIGHER",
    name: "Higher",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x0578d8a44db98b23bf096a382e016e29a5ce0ffe.png",
  },
  {
    address: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed",
    symbol: "DEGEN",
    name: "Degen",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x4ed4e862860bed51a9570b96d89af5e1b0efefed.png",
  },
  {
    address: "0xbc45647ea894030a4e9801ec03479739fa2485f0",
    symbol: "BRETT",
    name: "Brett",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0xbc45647ea894030a4e9801ec03479739fa2485f0.png",
  },
  {
    address: "0xb1a03eda10342529bbf8eb700a06c60441fef25d",
    symbol: "MIGGLES",
    name: "Miggles",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0xb1a03eda10342529bbf8eb700a06c60441fef25d.png",
  },
  {
    address: "0x532f27101965dd16442e59d40670faf5ebb142e4",
    symbol: "TOSHI",
    name: "Toshi",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x532f27101965dd16442e59d40670faf5ebb142e4.png",
  },
  {
    address: "0x2da56acb9ea78330f947bd57c54119debda7af71",
    symbol: "MOCHI",
    name: "Mochi",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x2da56acb9ea78330f947bd57c54119debda7af71.png",
  },
  {
    address: "0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4",
    symbol: "TYBG",
    name: "Thank You Based God",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4.png",
  },
  {
    address: "0x6921b130d297cc43754afba22e5eac0fbf8db75b",
    symbol: "DOGINME",
    name: "Doginme",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x6921b130d297cc43754afba22e5eac0fbf8db75b.png",
  },
  {
    address: "0xe3086852a4b125803c815a158249ae468a3254ca",
    symbol: "MFERCOIN",
    name: "mfercoin",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0xe3086852a4b125803c815a158249ae468a3254ca.png",
  },
  {
    address: "0x52b492a33e447cdb854c7fc19f1e57e8bfa1777d",
    symbol: "KEYCAT",
    name: "Keyboard Cat",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x52b492a33e447cdb854c7fc19f1e57e8bfa1777d.png",
  },
  {
    address: "0x4f9fd6be4a90f2620a6d1d501e67b8016bf15236",
    symbol: "CHOMP",
    name: "Chomp",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x4f9fd6be4a90f2620a6d1d501e67b8016bf15236.png",
  },
  {
    address: "0x6dae8b4af55b21b532e29d8fae7f1d686f43cab9",
    symbol: "ROCKY",
    name: "Rocky",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x6dae8b4af55b21b532e29d8fae7f1d686f43cab9.png",
  },
  {
    address: "0x3c281a39944a2319aa653d81cfd93ca10983d234",
    symbol: "FUDE",
    name: "Fude",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x3c281a39944a2319aa653d81cfd93ca10983d234.png",
  },
  {
    address: "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b",
    symbol: "VIRTUAL",
    name: "Virtual Protocol",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b.png",
  },
  {
    address: "0x940181a94a35a4569e4529a3cdfb74e38fd98631",
    symbol: "AERO",
    name: "Aerodrome",
    imageUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x940181a94a35a4569e4529a3cdfb74e38fd98631.png",
  },
];

export function pickRandomCoins(n: number): CoinCandidate[] {
  const pool = [...CANDIDATES];
  const picks: CoinCandidate[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picks.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picks;
}
