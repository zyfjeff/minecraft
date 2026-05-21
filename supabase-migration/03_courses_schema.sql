-- =============================================================================
-- 03 — Courses module schema (consolidated)
--
-- Merges the DDL from three legacy files into a single idempotent script:
--   * supabase-courses-schema.sql       (courses / lessons / vocab / questions / user_course_progress)
--   * supabase-courses-segments.sql     (lesson_segments / user_segment_attempts)
--   * supabase-courses-segments-v2.sql  (lesson_segments.quiz_payload, expanded qtype, user_lesson_reports)
--
-- Seed data from those files lives in 12_seed_segments.sql / 09_seed_courses.sql.
--
-- Depends on public.set_updated_at() (defined in 02_core_schema.sql).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) courses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id              text        PRIMARY KEY,
  kind            text        NOT NULL CHECK (kind IN ('listening','reading','vocabulary')),
  title           text        NOT NULL,
  description     text        NOT NULL DEFAULT '',
  difficulty      smallint    NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  est_minutes     int         NOT NULL DEFAULT 5,
  xp_reward       int         NOT NULL DEFAULT 0,
  unlock_level    smallint    NOT NULL DEFAULT 1,
  thumbnail_key   text        NOT NULL DEFAULT 'blocks',
  source_label    text        NOT NULL DEFAULT '',
  source_url      text,
  source_license  text        NOT NULL DEFAULT '' CHECK (
    source_license IN ('', 'CC-BY-SA-4.0', 'youtube-embed', 'original')
  ),
  sort_order      int         NOT NULL DEFAULT 0,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_courses_sort_order ON public.courses(sort_order);
CREATE INDEX IF NOT EXISTS idx_courses_active     ON public.courses(is_active);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses readable by authenticated" ON public.courses;
CREATE POLICY "courses readable by authenticated"
  ON public.courses FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 2) lessons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
  id                text        PRIMARY KEY,
  course_id         text        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  step_index        smallint    NOT NULL DEFAULT 0,
  kind              text        NOT NULL CHECK (kind IN ('video_segment','reading_passage','vocab_drill')),
  title             text        NOT NULL DEFAULT '',
  -- video_segment fields
  yt_video_id       text,
  yt_start_sec      int,
  yt_end_sec        int,
  -- reading_passage fields
  passage_md        text,
  -- shared
  transcript_en     text,
  transcript_zh     text,
  highlight_words   text[]      NOT NULL DEFAULT '{}',
  xp_reward         int         NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, step_index)
);

DROP TRIGGER IF EXISTS trg_lessons_updated_at ON public.lessons;
CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id, step_index);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons readable by authenticated" ON public.lessons;
CREATE POLICY "lessons readable by authenticated"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 3) vocab
--    NOTE: Extra columns (synonyms / minecraft_role / minecraft_obtain) are
--    added by 04_vocab_enhance.sql so the schema here matches the original
--    file shape.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vocab (
  id              text        PRIMARY KEY,
  word            text        NOT NULL,
  pos             text        NOT NULL DEFAULT '' CHECK (
    pos IN ('', 'noun', 'verb', 'adj', 'adv', 'prep', 'phrase')
  ),
  definition_en   text        NOT NULL DEFAULT '',
  definition_zh   text        NOT NULL DEFAULT '',
  example_en      text        NOT NULL DEFAULT '',
  example_zh      text        NOT NULL DEFAULT '',
  pixel_icon      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vocab_word ON public.vocab(word);

ALTER TABLE public.vocab ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vocab readable by authenticated" ON public.vocab;
CREATE POLICY "vocab readable by authenticated"
  ON public.vocab FOR SELECT
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 4) questions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id              bigserial   PRIMARY KEY,
  lesson_id       text        NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  kind            text        NOT NULL CHECK (kind IN ('mcq','fill_blank','match')),
  prompt          text        NOT NULL,
  payload         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  xp_reward       int         NOT NULL DEFAULT 5,
  sort_order      int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_lesson ON public.questions(lesson_id, sort_order);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questions readable by authenticated" ON public.questions;
CREATE POLICY "questions readable by authenticated"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 5) user_course_progress
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_course_progress (
  user_id                 uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id               text        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_lesson_ids    text[]      NOT NULL DEFAULT '{}',
  completed_question_ids  bigint[]    NOT NULL DEFAULT '{}',
  last_accessed_at        timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

DROP TRIGGER IF EXISTS trg_ucp_updated_at ON public.user_course_progress;
CREATE TRIGGER trg_ucp_updated_at
  BEFORE UPDATE ON public.user_course_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ucp_user ON public.user_course_progress(user_id);

ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ucp readable by self" ON public.user_course_progress;
CREATE POLICY "ucp readable by self"
  ON public.user_course_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ucp insertable by self" ON public.user_course_progress;
CREATE POLICY "ucp insertable by self"
  ON public.user_course_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ucp updatable by self" ON public.user_course_progress;
CREATE POLICY "ucp updatable by self"
  ON public.user_course_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6) lesson_segments  (P2 + P3 merged: includes quiz_payload + expanded qtype)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_segments (
  id              bigserial    PRIMARY KEY,
  lesson_id       text         NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  sort_order      smallint     NOT NULL DEFAULT 0,
  start_sec       numeric(8,2) NOT NULL DEFAULT 0,
  end_sec         numeric(8,2) NOT NULL DEFAULT 0,
  sentence_en     text         NOT NULL,
  sentence_zh     text         NOT NULL DEFAULT '',
  blank_word      text,                              -- nullable: segment may be reveal-only
  distractors     text[]       NOT NULL DEFAULT '{}', -- empty => front-end builds chips dynamically
  qtype           text         NOT NULL DEFAULT 'cloze' CHECK (qtype IN (
    'cloze','comprehension','detail_mcq','true_false',
    'sound_match','speaker_intent','phonetic_pair','none'
  )),
  quiz_payload    jsonb,                             -- structured data for non-cloze types
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, sort_order)
);

COMMENT ON COLUMN public.lesson_segments.quiz_payload IS
  'Structured question data for non-cloze types. Schema varies by qtype: '
  'comprehension/detail_mcq/speaker_intent -> {prompt, options:[], correct:idx}; '
  'true_false -> {statement, correct:bool}; '
  'sound_match -> {prompt, options:[{label,icon}], correct:idx}; '
  'phonetic_pair -> {pair:[wordA,wordB], correct:0|1}';

DROP TRIGGER IF EXISTS trg_lesson_segments_updated_at ON public.lesson_segments;
CREATE TRIGGER trg_lesson_segments_updated_at
  BEFORE UPDATE ON public.lesson_segments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_lesson_segments_lesson
  ON public.lesson_segments(lesson_id, sort_order);

ALTER TABLE public.lesson_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_segments readable by authenticated" ON public.lesson_segments;
CREATE POLICY "lesson_segments readable by authenticated"
  ON public.lesson_segments FOR SELECT
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 7) user_segment_attempts (append-only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_segment_attempts (
  id                  bigserial   PRIMARY KEY,
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment_id          bigint      NOT NULL REFERENCES public.lesson_segments(id) ON DELETE CASCADE,
  choice              text        NOT NULL DEFAULT '',
  is_correct          boolean     NOT NULL DEFAULT false,
  hearts_left_after   smallint    NOT NULL DEFAULT 0,
  qtype               text        NOT NULL DEFAULT 'cloze',
  attempted_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usa_user_segment
  ON public.user_segment_attempts(user_id, segment_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_usa_user_attempted
  ON public.user_segment_attempts(user_id, attempted_at DESC);

ALTER TABLE public.user_segment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usa readable by self" ON public.user_segment_attempts;
CREATE POLICY "usa readable by self"
  ON public.user_segment_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usa insertable by self" ON public.user_segment_attempts;
CREATE POLICY "usa insertable by self"
  ON public.user_segment_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 8) user_lesson_reports — post-lesson summary cards
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_lesson_reports (
  id                bigserial   PRIMARY KEY,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id         text        NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  total_segments    smallint    NOT NULL DEFAULT 0,
  correct_count     smallint    NOT NULL DEFAULT 0,
  per_qtype_scores  jsonb       NOT NULL DEFAULT '{}',
  weak_areas        text[]      NOT NULL DEFAULT '{}',
  hearts_remaining  smallint    NOT NULL DEFAULT 0,
  time_spent_sec    integer     NOT NULL DEFAULT 0,
  completed_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ulr_user_lesson
  ON public.user_lesson_reports(user_id, lesson_id, completed_at DESC);

ALTER TABLE public.user_lesson_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ulr readable by self" ON public.user_lesson_reports;
CREATE POLICY "ulr readable by self"
  ON public.user_lesson_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ulr insertable by self" ON public.user_lesson_reports;
CREATE POLICY "ulr insertable by self"
  ON public.user_lesson_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
