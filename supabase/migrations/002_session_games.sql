-- Individual game records per session (populated by background poller)
CREATE TABLE IF NOT EXISTS public.session_games (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID        NOT NULL REFERENCES public.player_sessions(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  match_id     TEXT        NOT NULL,
  result       TEXT        NOT NULL CHECK (result IN ('win', 'loss')),
  champion     TEXT,
  kills        INTEGER,
  deaths       INTEGER,
  assists      INTEGER,
  cs           INTEGER,
  duration     INTEGER,    -- seconds
  vision_score INTEGER,
  source       TEXT        NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
  played_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, match_id)
);

ALTER TABLE public.session_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_games_select" ON public.session_games
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "session_games_insert" ON public.session_games
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "session_games_delete" ON public.session_games
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_session_games_session ON public.session_games (session_id);
CREATE INDEX idx_session_games_user    ON public.session_games (user_id);
