-- =============================================================================
-- 14 — Anonymous read-only access: allow the Supabase `anon` role to SELECT
--      public course content so guest users can browse without signing in.
--
-- Tables affected:
--   courses, lessons, vocab, lesson_segments, questions
--
-- This does NOT grant anon access to user-specific tables (profiles,
-- quest_completions, user_course_progress, user_achievements, etc.).
-- =============================================================================

-- courses: anon can read active courses
DROP POLICY IF EXISTS "courses readable by anon" ON public.courses;
CREATE POLICY "courses readable by anon"
  ON public.courses FOR SELECT
  TO anon
  USING (is_active = true);

-- lessons: anon can read all lessons (they're children of active courses)
DROP POLICY IF EXISTS "lessons readable by anon" ON public.lessons;
CREATE POLICY "lessons readable by anon"
  ON public.lessons FOR SELECT
  TO anon
  USING (true);

-- vocab: anon can read the full vocabulary dictionary
DROP POLICY IF EXISTS "vocab readable by anon" ON public.vocab;
CREATE POLICY "vocab readable by anon"
  ON public.vocab FOR SELECT
  TO anon
  USING (true);

-- lesson_segments: anon can read all segments
DROP POLICY IF EXISTS "lesson_segments readable by anon" ON public.lesson_segments;
CREATE POLICY "lesson_segments readable by anon"
  ON public.lesson_segments FOR SELECT
  TO anon
  USING (true);

-- questions: anon can read quiz questions
DROP POLICY IF EXISTS "questions readable by anon" ON public.questions;
CREATE POLICY "questions readable by anon"
  ON public.questions FOR SELECT
  TO anon
  USING (true);

-- quests: anon can read quest catalog (for guest Home preview)
DROP POLICY IF EXISTS "quests readable by anon" ON public.quests;
CREATE POLICY "quests readable by anon"
  ON public.quests FOR SELECT
  TO anon
  USING (active = true);

-- achievements: anon can read achievement catalog
DROP POLICY IF EXISTS "achievements readable by anon" ON public.achievements;
CREATE POLICY "achievements readable by anon"
  ON public.achievements FOR SELECT
  TO anon
  USING (active = true);
