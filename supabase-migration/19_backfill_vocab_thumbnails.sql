-- =============================================================================
-- 19 — Backfill vocabulary courses' thumbnail_key from default 'blocks'
--      to the dedicated v_* icon set.
--
-- Background:
--   `thumbnail_key` is declared NOT NULL DEFAULT 'blocks' (03_courses_schema.sql),
--   and 16_seed_vocab_course_structure.sql did NOT specify the column when
--   inserting the 10 vocabulary courses. As a result they all defaulted to
--   'blocks', and the front-end's resolveThumbnailKey() short-circuited on
--   the explicit value, making every vocab card render the same icon.
--
--   The front-end has been patched to treat 'blocks' as unset for reading/
--   vocabulary kinds, but we also persist the correct keys in DB so that the
--   Admin UI and any future server-side consumers see the intended value.
--
-- Idempotent: only updates rows whose thumbnail_key still equals 'blocks'.
-- =============================================================================

UPDATE public.courses SET thumbnail_key = 'v_hostile'   WHERE id = 'vocab-hostile-mobs'       AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_animal'    WHERE id = 'vocab-friendly-animals'   AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_tools'     WHERE id = 'vocab-tools-weapons'      AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_resources' WHERE id = 'vocab-precious-resources' AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_food'      WHERE id = 'vocab-food-cooking'       AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_nature'    WHERE id = 'vocab-nature-landscape'   AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_dimension' WHERE id = 'vocab-nether-end'         AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_crafting'  WHERE id = 'vocab-crafting-machines'  AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_action'    WHERE id = 'vocab-action-verbs'       AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_adjective' WHERE id = 'vocab-describing-words'   AND thumbnail_key = 'blocks';
-- Bundle-imported courses (added via Admin Bulk Import, also defaulted to 'blocks'):
UPDATE public.courses SET thumbnail_key = 'v_adventure' WHERE id = 'vocab-adventure-survival' AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_building'  WHERE id = 'vocab-building-crafting'  AND thumbnail_key = 'blocks';
UPDATE public.courses SET thumbnail_key = 'v_world'     WHERE id = 'vocab-nature-world'       AND thumbnail_key = 'blocks';
