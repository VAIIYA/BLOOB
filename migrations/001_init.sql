-- AgarSol – Initial Database Migration
-- Run this once against your Vercel Postgres database.

-- ─── Enable extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  wallet_address       TEXT PRIMARY KEY,
  username             TEXT UNIQUE NOT NULL,
  skin_id              TEXT NOT NULL DEFAULT 'classic',
  coins                INTEGER NOT NULL DEFAULT 0,
  total_games          INTEGER NOT NULL DEFAULT 0,
  total_mass_eaten     INTEGER NOT NULL DEFAULT 0,
  highest_mass         INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  username_changed_at  TIMESTAMPTZ
);

-- ─── Owned skins ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owned_skins (
  wallet_address  TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  skin_id         TEXT NOT NULL,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (wallet_address, skin_id)
);

-- ─── Game sessions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address   TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  room_id          TEXT NOT NULL,
  mass_eaten       INTEGER NOT NULL DEFAULT 0,
  final_mass       INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_owned_skins_wallet ON owned_skins (wallet_address);
CREATE INDEX IF NOT EXISTS idx_sessions_wallet    ON game_sessions (wallet_address);
CREATE INDEX IF NOT EXISTS idx_sessions_room      ON game_sessions (room_id);
