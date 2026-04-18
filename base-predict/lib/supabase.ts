import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy singletons — avoids build-time crash when env vars are missing
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/** Public client — uses anon key, respects RLS */
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

/** Admin client — uses service role key, bypasses RLS. Server-side only. */
function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

// Proxy wrappers — behave like direct client references but lazy-init on first access
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ---------- TypeScript row types ----------

export interface UserRow {
  address: string;
  streak: number;
  best_streak: number;
  total_points: number;
  total_correct: number;
  total_predictions: number;
  created_at: string;
  last_seen: string;
}

export interface CoinEntry {
  address: string;
  symbol: string;
  name: string;
  startPrice: number;
  imageUrl: string;
}

export interface DailyCoinsRow {
  date: string;
  coins: CoinEntry[];
  resolved: boolean;
  winner_address: string | null;
  resolved_at: string | null;
}

export interface PredictionRow {
  id: number;
  user_address: string;
  date: string;
  picked_coin: string;
  correct: boolean | null;
  points_awarded: number;
  created_at: string;
}
