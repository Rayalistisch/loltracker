-- =============================================================================
-- Loltracker — Initial Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- =============================================================================
-- PLAYER PROFILES
-- Auto-created 1:1 with auth.users via trigger
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username              TEXT UNIQUE NOT NULL,
  display_name          TEXT NOT NULL,
  avatar_url            TEXT,
  bio                   TEXT CHECK (char_length(bio) <= 280),
  region                TEXT NOT NULL DEFAULT 'EUW',
  riot_id               TEXT,
  riot_id_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  peak_rank             TEXT,
  current_rank          TEXT,
  main_role             TEXT NOT NULL DEFAULT 'FILL',
  secondary_role        TEXT,
  playstyle_tags        TEXT[] DEFAULT '{}',
  looking_for_duo       BOOLEAN NOT NULL DEFAULT FALSE,
  is_public             BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  discipline_score      INTEGER NOT NULL DEFAULT 50 CHECK (discipline_score BETWEEN 0 AND 100),
  streak_days           INTEGER NOT NULL DEFAULT 0,
  total_sessions        INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_username ON public.player_profiles (username);
CREATE INDEX IF NOT EXISTS idx_player_profiles_looking_for_duo ON public.player_profiles (region, current_rank)
  WHERE looking_for_duo = TRUE;

-- RLS
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_profiles_select" ON public.player_profiles
  FOR SELECT USING (auth.uid() = id OR is_public = TRUE);

CREATE POLICY "player_profiles_insert" ON public.player_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "player_profiles_update" ON public.player_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "player_profiles_delete" ON public.player_profiles
  FOR DELETE USING (auth.uid() = id);

-- Auto-update updated_at
CREATE TRIGGER player_profiles_updated_at
  BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- CONNECTED GAME ACCOUNTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.connected_game_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  riot_id           TEXT NOT NULL,
  region            TEXT NOT NULL,
  is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
  verified          BOOLEAN NOT NULL DEFAULT FALSE,
  verification_code TEXT,
  last_synced_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, riot_id, region)
);

CREATE INDEX IF NOT EXISTS idx_cga_user_id ON public.connected_game_accounts (user_id);

ALTER TABLE public.connected_game_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cga_all" ON public.connected_game_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER cga_updated_at
  BEFORE UPDATE ON public.connected_game_accounts
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- PLAYER SESSIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'completed', 'abandoned')),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  planned_games   INTEGER,
  actual_games    INTEGER,
  games_won       INTEGER,
  games_lost      INTEGER,
  rank_at_start   TEXT,
  rank_at_end     TEXT,
  lp_delta        INTEGER,
  notes           TEXT,
  tilt_score      INTEGER CHECK (tilt_score BETWEEN 0 AND 100),
  stop_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_sessions_user_created
  ON public.player_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_sessions_user_status
  ON public.player_sessions (user_id, status);

ALTER TABLE public.player_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_sessions_all" ON public.player_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER player_sessions_updated_at
  BEFORE UPDATE ON public.player_sessions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- PRE-GAME CHECK-INS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pre_game_checkins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL UNIQUE REFERENCES public.player_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  mental_state    INTEGER NOT NULL CHECK (mental_state BETWEEN 1 AND 5),
  energy_level    INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  tilt_risk       INTEGER NOT NULL CHECK (tilt_risk BETWEEN 1 AND 5),
  goal            TEXT NOT NULL,
  planned_games   INTEGER NOT NULL,
  planned_roles   TEXT[] DEFAULT '{}',
  champion_pool   TEXT[] DEFAULT '{}',
  stop_condition  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pre_checkins_user_id ON public.pre_game_checkins (user_id);
CREATE INDEX IF NOT EXISTS idx_pre_checkins_session_id ON public.pre_game_checkins (session_id);

ALTER TABLE public.pre_game_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pre_checkins_all" ON public.pre_game_checkins
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- POST-GAME REFLECTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.post_game_reflections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id              UUID NOT NULL UNIQUE REFERENCES public.player_sessions(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  followed_stop_condition BOOLEAN NOT NULL DEFAULT FALSE,
  mental_state_end        INTEGER NOT NULL CHECK (mental_state_end BETWEEN 1 AND 5),
  tilt_moments            INTEGER NOT NULL DEFAULT 0,
  biggest_mistake         TEXT,
  what_went_well          TEXT,
  improvement_focus       TEXT,
  would_play_again        BOOLEAN,
  overall_rating          INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_reflections_user_id ON public.post_game_reflections (user_id);
CREATE INDEX IF NOT EXISTS idx_post_reflections_session_id ON public.post_game_reflections (session_id);

ALTER TABLE public.post_game_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_reflections_all" ON public.post_game_reflections
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- SESSION LOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.session_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.player_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL
                CHECK (event_type IN ('game_start', 'game_end', 'tilt_flag', 'note', 'break')),
  event_data  JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON public.session_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_user_created
  ON public.session_logs (user_id, created_at DESC);

ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_logs_all" ON public.session_logs
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- DUO PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.duo_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_roles         TEXT[] NOT NULL DEFAULT '{}',
  preferred_partner_roles TEXT[] DEFAULT '{}',
  rank_min                TEXT,
  rank_max                TEXT,
  communication_style     TEXT[] DEFAULT '{}',
  vibe_tags               TEXT[] DEFAULT '{}',
  languages               TEXT[] NOT NULL DEFAULT ARRAY['en'],
  availability            JSONB NOT NULL DEFAULT '{}',
  bio_duo                 TEXT,
  last_active_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duo_profiles_active ON public.duo_profiles (is_active)
  WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_duo_profiles_user_id ON public.duo_profiles (user_id);

ALTER TABLE public.duo_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duo_profiles_select" ON public.duo_profiles
  FOR SELECT USING (is_active = TRUE OR auth.uid() = user_id);

CREATE POLICY "duo_profiles_insert" ON public.duo_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "duo_profiles_update" ON public.duo_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "duo_profiles_delete" ON public.duo_profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER duo_profiles_updated_at
  BEFORE UPDATE ON public.duo_profiles
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- DUO PREFERENCES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.duo_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  max_rank_gap        INTEGER NOT NULL DEFAULT 1,
  preferred_regions   TEXT[] NOT NULL DEFAULT ARRAY['same'],
  require_voice       BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_play_times JSONB NOT NULL DEFAULT '{}',
  priority_weights    JSONB NOT NULL DEFAULT '{"rank": 0.25, "role": 0.30, "availability": 0.20, "vibe": 0.15, "communication": 0.10}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.duo_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duo_preferences_all" ON public.duo_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER duo_preferences_updated_at
  BEFORE UPDATE ON public.duo_preferences
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- DUO MATCH REQUESTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.duo_match_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id           UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  receiver_id         UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn', 'expired')),
  message             TEXT,
  compatibility_score INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  UNIQUE (sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_duo_requests_receiver_status
  ON public.duo_match_requests (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_duo_requests_sender_id
  ON public.duo_match_requests (sender_id);

ALTER TABLE public.duo_match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duo_requests_select" ON public.duo_match_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "duo_requests_insert" ON public.duo_match_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "duo_requests_update_receiver" ON public.duo_match_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE TRIGGER duo_requests_updated_at
  BEFORE UPDATE ON public.duo_match_requests
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Sender withdraw function (bypasses UPDATE policy)
CREATE OR REPLACE FUNCTION public.withdraw_duo_request(request_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.duo_match_requests
  SET status = 'withdrawn'
  WHERE id = request_id
    AND sender_id = auth.uid()
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SAVED DUOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.saved_duos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  saved_user_id   UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, saved_user_id),
  CHECK (user_id != saved_user_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_duos_user_id ON public.saved_duos (user_id);

ALTER TABLE public.saved_duos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_duos_all" ON public.saved_duos
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- CHAMPIONS (static reference data)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.champions (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  roles       TEXT[] NOT NULL DEFAULT '{}',
  difficulty  INTEGER CHECK (difficulty BETWEEN 1 AND 3),
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.champions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "champions_read_all" ON public.champions
  FOR SELECT USING (TRUE);

-- =============================================================================
-- PLAYER CHAMPION STATS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_champion_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  champion_id     INTEGER NOT NULL REFERENCES public.champions(id),
  games_played    INTEGER NOT NULL DEFAULT 0,
  wins            INTEGER NOT NULL DEFAULT 0,
  mastery_level   INTEGER,
  is_in_pool      BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, champion_id)
);

CREATE INDEX IF NOT EXISTS idx_pcs_user_id ON public.player_champion_stats (user_id);

ALTER TABLE public.player_champion_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pcs_select" ON public.player_champion_stats
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.player_profiles
      WHERE id = player_champion_stats.user_id AND is_public = TRUE
    )
  );

CREATE POLICY "pcs_write" ON public.player_champion_stats
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER pcs_updated_at
  BEFORE UPDATE ON public.player_champion_stats
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- PLAYER ROLE STATS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_role_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  games_played    INTEGER NOT NULL DEFAULT 0,
  wins            INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_prs_user_id ON public.player_role_stats (user_id);

ALTER TABLE public.player_role_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prs_select" ON public.player_role_stats
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.player_profiles
      WHERE id = player_role_stats.user_id AND is_public = TRUE
    )
  );

CREATE POLICY "prs_write" ON public.player_role_stats
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER prs_updated_at
  BEFORE UPDATE ON public.player_role_stats
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- NOTIFICATION SETTINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  email_duo_requests          BOOLEAN NOT NULL DEFAULT TRUE,
  email_weekly_summary        BOOLEAN NOT NULL DEFAULT TRUE,
  email_streak_reminders      BOOLEAN NOT NULL DEFAULT FALSE,
  in_app_duo_requests         BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_stop_recommendations BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_time               TIME,
  reminder_days               TEXT[] DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_settings_all" ON public.notification_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- WEEKLY SUMMARIES (computed/cached)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.weekly_summaries (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  week_start                DATE NOT NULL,
  sessions_count            INTEGER NOT NULL DEFAULT 0,
  total_games               INTEGER NOT NULL DEFAULT 0,
  games_won                 INTEGER NOT NULL DEFAULT 0,
  lp_net                    INTEGER NOT NULL DEFAULT 0,
  avg_mental_start          NUMERIC(3,2),
  avg_mental_end            NUMERIC(3,2),
  tilt_incidents            INTEGER NOT NULL DEFAULT 0,
  stop_conditions_followed  INTEGER NOT NULL DEFAULT 0,
  discipline_score          INTEGER NOT NULL DEFAULT 50,
  streak_at_end             INTEGER NOT NULL DEFAULT 0,
  computed_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_week
  ON public.weekly_summaries (user_id, week_start DESC);

ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_summaries_all" ON public.weekly_summaries
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- AUTO-CREATE PROFILE ON REGISTRATION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Derive base username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '_'))
  );

  -- Ensure valid slug format
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_-]', '', 'g');
  base_username := SUBSTRING(base_username, 1, 24);

  IF LENGTH(base_username) < 3 THEN
    base_username := 'player_' || SUBSTRING(NEW.id::TEXT, 1, 8);
  END IF;

  -- Find unique username
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.player_profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter;
  END LOOP;

  -- Insert profile
  INSERT INTO public.player_profiles (id, username, display_name)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', final_username)
  );

  -- Insert default notification settings
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
