-- =============================================================================
-- 07 — Admin RLS policies (consolidated)
--
-- Merges the write-side policies from:
--   * supabase-admin-rls.sql           (courses / lessons / lesson_segments / questions / vocab)
--   * supabase-admin-quests-rls.sql    (quests)
--   * supabase-admin-rewards-rls.sql   (achievements / user_achievements)
--
-- The is_admin() function is expected to exist already (see 05_functions.sql).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- courses — admin full access (incl. inactive rows via separate SELECT policy)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin read all courses" ON public.courses;
CREATE POLICY "admin read all courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin manage courses" ON public.courses;
CREATE POLICY "admin manage courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- lessons
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin manage lessons" ON public.lessons;
CREATE POLICY "admin manage lessons"
  ON public.lessons FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- lesson_segments
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin manage segments" ON public.lesson_segments;
CREATE POLICY "admin manage segments"
  ON public.lesson_segments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- questions
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin manage questions" ON public.questions;
CREATE POLICY "admin manage questions"
  ON public.questions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- vocab
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin manage vocab" ON public.vocab;
CREATE POLICY "admin manage vocab"
  ON public.vocab FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- quests
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin manage quests" ON public.quests;
CREATE POLICY "admin manage quests"
  ON public.quests FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- achievements
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin manage achievements" ON public.achievements;
CREATE POLICY "admin manage achievements"
  ON public.achievements FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- user_achievements — admin can read all + manage (revoke)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin read all user_achievements" ON public.user_achievements;
CREATE POLICY "admin read all user_achievements"
  ON public.user_achievements FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin manage user_achievements" ON public.user_achievements;
CREATE POLICY "admin manage user_achievements"
  ON public.user_achievements FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
