-- ============================================================
-- Base Predict — Supabase Schema
-- Run this in your Supabase SQL Editor to bootstrap the DB.
-- ============================================================

-- Users table: wallet address is the primary key
create table if not exists users (
  address       text primary key,
  streak        int default 0 not null,
  best_streak   int default 0 not null,
  total_points  int default 0 not null,
  total_correct int default 0 not null,
  total_predictions int default 0 not null,
  created_at    timestamptz default now() not null,
  last_seen     timestamptz default now() not null
);

-- Daily coins: which 3 coins are featured each day
create table if not exists daily_coins (
  date           date primary key,
  coins          jsonb not null,
  -- coins shape: [{address, symbol, name, startPrice, imageUrl}]
  resolved       boolean default false not null,
  winner_address text,
  resolved_at    timestamptz
);

-- Individual predictions
create table if not exists predictions (
  id             bigserial primary key,
  user_address   text references users(address) on delete cascade not null,
  date           date not null,
  picked_coin    text not null,
  correct        boolean,
  points_awarded int default 0,
  created_at     timestamptz default now() not null,
  unique(user_address, date)
);

-- Performance indexes
create index if not exists idx_predictions_date on predictions(date);
create index if not exists idx_predictions_user on predictions(user_address);
create index if not exists idx_users_points on users(total_points desc);
create index if not exists idx_users_streak on users(streak desc);

-- Row Level Security: public reads, service-role writes
alter table users enable row level security;
alter table predictions enable row level security;
alter table daily_coins enable row level security;

-- Read-only policies for anonymous/authenticated
create policy "read users" on users for select using (true);
create policy "read predictions" on predictions for select using (true);
create policy "read daily_coins" on daily_coins for select using (true);
