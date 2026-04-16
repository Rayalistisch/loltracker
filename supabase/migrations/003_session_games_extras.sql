-- Add extended per-game stats columns to session_games
-- Run this in the Supabase SQL Editor

ALTER TABLE session_games
  ADD COLUMN IF NOT EXISTS wards_placed    INTEGER,
  ADD COLUMN IF NOT EXISTS wards_killed    INTEGER,
  ADD COLUMN IF NOT EXISTS control_wards   INTEGER,
  ADD COLUMN IF NOT EXISTS cc_score        INTEGER,   -- seconds of CC applied to enemies
  ADD COLUMN IF NOT EXISTS damage_to_champs INTEGER,
  ADD COLUMN IF NOT EXISTS heal_shield     INTEGER,   -- total heal + shield on teammates
  ADD COLUMN IF NOT EXISTS gold_earned     INTEGER;
