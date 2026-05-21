-- =============================================================================
-- 18_courses_card_view.sql — Lightweight projection used by CourseList.
--
-- Why: previously the client did `courses.select('..., lessons(id, step_index,
-- yt_video_id)')` for the entire catalog, which pulled the full lesson tree
-- across 60+ courses just to compute a count + the first lesson's yt id. That
-- means O(courses * avg_lessons) rows on every cold load.
--
-- This view aggregates server-side so the client receives one row per course
-- with the two fields it actually needs (lessons_count, yt_video_id) plus the
-- normal card metadata. No client-side flattening required.
--
-- Idempotent: drops + recreates the view. RLS for views inherits the SELECT
-- policy of the underlying tables (`courses`, `lessons`). Both already allow
-- `select` to authenticated users in 03_courses_schema.sql / 07_admin_rls.sql.
-- =============================================================================

DROP VIEW IF EXISTS public.courses_card_view CASCADE;

CREATE VIEW public.courses_card_view AS
SELECT
  c.id,
  c.kind,
  c.title,
  c.description,
  c.difficulty,
  c.est_minutes,
  c.xp_reward,
  c.unlock_level,
  c.thumbnail_key,
  c.source_label,
  c.source_url,
  c.source_license,
  c.sort_order,
  c.is_active,
  COALESCE(agg.lessons_count, 0)::int AS lessons_count,
  agg.first_yt_video_id              AS yt_video_id
FROM public.courses c
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int                                                AS lessons_count,
    (ARRAY_AGG(l.yt_video_id ORDER BY l.step_index ASC NULLS LAST))[1]
                                                                  AS first_yt_video_id
  FROM public.lessons l
  WHERE l.course_id = c.id
) agg ON TRUE;

-- Allow authenticated + anon users to select. Underlying RLS on courses/lessons
-- will still gate row visibility; this just exposes the view itself.
GRANT SELECT ON public.courses_card_view TO anon, authenticated;
