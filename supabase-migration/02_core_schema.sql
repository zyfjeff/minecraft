-- =============================================================================
-- 02 — Core schema: profiles / quests / quest_completions / achievements /
--                    user_achievements
--
-- These five tables are the heart of the gamification layer and were missing
-- from the original repo (only RLS + seed scripts were committed; the DDL had
-- been authored manually in the Supabase Dashboard). This file reconstructs
-- their full structure from the application code so a brand-new self-hosted
-- instance can be bootstrapped from zero.
--
-- Field shapes inferred from:
--   - src/auth/AuthContext.jsx           (profiles read/insert/update)
--   - src/lib/quests.js / quests-list.js (quests + quest_completions)
--   - src/lib/achievements.js            (achievements + user_achievements)
--   - src/admin/AdminQuestsEditor.jsx    (quest field types)
--   - src/admin/AdminRewardsEditor.jsx   (achievement field types)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 0) Shared helper: keep updated_at in sync on UPDATE.
--    Defined here (idempotent) so subsequent files can reuse it without
--    worrying about load order. 05_functions.sql also CREATE OR REPLACEs it,
--    which is fine — the body is identical.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 1) profiles — extends auth.users with gamification state
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text        NOT NULL DEFAULT 'Adventurer',
  level         smallint    NOT NULL DEFAULT 1,
  xp            integer     NOT NULL DEFAULT 0,
  xp_to_next    integer     NOT NULL DEFAULT 100,
  streak        integer     NOT NULL DEFAULT 0,
  last_quest_on date,                                    -- used by bump_streak() for idempotent daily roll
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles readable by self" ON public.profiles;
CREATE POLICY "profiles readable by self"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles insertable by self" ON public.profiles;
CREATE POLICY "profiles insertable by self"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles updatable by self" ON public.profiles;
CREATE POLICY "profiles updatable by self"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2) quests — catalog of daily learning tasks shown on Home
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quests (
  id            text        PRIMARY KEY,
  kind          text        NOT NULL CHECK (kind IN ('listen', 'read', 'vocab', 'quiz')),
  title         text        NOT NULL,
  description   text        NOT NULL DEFAULT '',
  xp_reward     integer     NOT NULL DEFAULT 10,
  duration_min  integer,                          -- nullable: not all quests have a fixed length
  unlock_level  smallint    NOT NULL DEFAULT 1,
  route         text,                             -- frontend route, e.g. '/courses/listening'
  color_token   text        NOT NULL DEFAULT 'tile-blue',
  icon_token    text        NOT NULL DEFAULT 'play',
  sort_order    integer     NOT NULL DEFAULT 0,
  active        boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quests_sort  ON public.quests(sort_order);
CREATE INDEX IF NOT EXISTS idx_quests_active ON public.quests(active);

DROP TRIGGER IF EXISTS trg_quests_updated_at ON public.quests;
CREATE TRIGGER trg_quests_updated_at
  BEFORE UPDATE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quests readable by authenticated" ON public.quests;
CREATE POLICY "quests readable by authenticated"
  ON public.quests FOR SELECT
  TO authenticated
  USING (active = true);

-- ----------------------------------------------------------------------------
-- 3) quest_completions — daily claim log (composite PK keeps it idempotent)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quest_completions (
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id      text        NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  completed_on  date        NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  xp_awarded    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quest_id, completed_on)
);

CREATE INDEX IF NOT EXISTS idx_qc_user_date
  ON public.quest_completions(user_id, completed_on DESC);
CREATE INDEX IF NOT EXISTS idx_qc_user_quest
  ON public.quest_completions(user_id, quest_id);

ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qc readable by self" ON public.quest_completions;
CREATE POLICY "qc readable by self"
  ON public.quest_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "qc insertable by self" ON public.quest_completions;
CREATE POLICY "qc insertable by self"
  ON public.quest_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4) achievements — catalog (admin-curated, publicly readable when active)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievements (
  id              text        PRIMARY KEY,
  name            text        NOT NULL,
  description     text        NOT NULL DEFAULT '',
  icon            text        NOT NULL DEFAULT 'star',
  color_token     text        NOT NULL DEFAULT 'tile-blue',
  condition_type  text        NOT NULL CHECK (
    condition_type IN ('quest_count', 'streak', 'level', 'vocab_count')
  ),
  threshold       integer     NOT NULL DEFAULT 1,
  sort_order      integer     NOT NULL DEFAULT 0,
  active          boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievements_sort ON public.achievements(sort_order);

DROP TRIGGER IF EXISTS trg_achievements_updated_at ON public.achievements;
CREATE TRIGGER trg_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievements readable by authenticated" ON public.achievements;
CREATE POLICY "achievements readable by authenticated"
  ON public.achievements FOR SELECT
  TO authenticated
  USING (active = true);

-- ----------------------------------------------------------------------------
-- 5) user_achievements — per-user unlock log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id  text        NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_ua_user_unlocked
  ON public.user_achievements(user_id, unlocked_at DESC);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ua readable by self" ON public.user_achievements;
CREATE POLICY "ua readable by self"
  ON public.user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ua insertable by self" ON public.user_achievements;
CREATE POLICY "ua insertable by self"
  ON public.user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Minimal example quests (commented out by default).
-- Uncomment + adjust if you want a few default quests on a fresh deployment;
-- otherwise create them via the Admin UI at /admin/quests after signing in.
-- =============================================================================
-- INSERT INTO public.quests (id, kind, title, description, xp_reward, duration_min, route, color_token, icon_token, sort_order)
-- VALUES
--   ('daily-listen',  'listen', 'Daily Listen',  'Complete one listening segment',  20, 5, '/courses/listening',  'tile-blue',   'headphones', 1),
--   ('daily-read',    'read',   'Daily Reading', 'Read one short passage',          15, 5, '/courses/reading',    'tile-green',  'book',       2),
--   ('daily-vocab',   'vocab',  'Daily Vocab',   'Learn 5 new words',               10, 3, '/vocab',              'tile-purple', 'diamond',    3),
--   ('daily-quiz',    'quiz',   'Daily Quiz',    'Pass a short quiz',               25, 5, '/courses',            'tile-orange', 'play',       4)
-- ON CONFLICT (id) DO NOTHING;
