-- =============================================================================
-- 13 — Seed quests: 12 daily quest catalog entries (3 per kind)
--
-- The frontend rotates one quest per kind per UTC day, so users see a
-- fresh combination of 4–5 quests every day. unlock_level provides
-- progressive reveal as the user levels up.
--
-- kind values: listen | read | vocab | quiz
-- =============================================================================

INSERT INTO public.quests
  (id, kind, title, description, xp_reward, duration_min, unlock_level, route, color_token, icon_token, sort_order, active)
VALUES
  -- ── Listen ×3 ─────────────────────────────────────────────────────────
  ('daily-listen',      'listen', 'Daily Listen',      'Complete one listening segment',          20,   5, 1, '/courses', 'tile-blue',   'headphones',  1, true),
  ('listen-challenge',  'listen', 'Listening Sprint',  'Finish 2 listening lessons today',       30,  10, 1, '/courses', 'tile-blue',   'play',        2, true),
  ('listen-explore',    'listen', 'New Ears',          'Try a course you have not started yet',  25,   8, 3, '/courses', 'tile-blue',   'headphones',  3, true),

  -- ── Read ×3 ───────────────────────────────────────────────────────────
  ('daily-read',        'read',   'Daily Reading',     'Read one short passage',                 15,   5, 1, '/courses', 'tile-green',  'book',        4, true),
  ('read-challenge',    'read',   'Reading Streak',    'Read 2 passages today',                  25,  10, 1, '/courses', 'tile-green',  'book',        5, true),
  ('read-deep',         'read',   'Deep Reader',       'Finish all quizzes in a reading lesson', 20,   8, 3, '/courses', 'tile-green',  'book',        6, true),

  -- ── Vocab ×3 ──────────────────────────────────────────────────────────
  ('daily-vocab',       'vocab',  'Daily Vocab',       'Learn 5 new words',                      10,   3, 1, '/courses', 'tile-purple', 'diamond',     7, true),
  ('vocab-review',      'vocab',  'Word Review',       'Review words from past lessons',         15,   5, 1, '/vocab-book','tile-purple','diamond',     8, true),
  ('vocab-master',      'vocab',  'Vocab Master',      'Score 100% on a vocab quiz',             30,   5, 4, '/courses', 'tile-purple', 'diamond',     9, true),

  -- ── Quiz ×3 ───────────────────────────────────────────────────────────
  ('daily-quiz',        'quiz',   'Daily Quiz',        'Pass a short quiz',                      25,   5, 1, '/courses', 'tile-orange', 'star',       10, true),
  ('quiz-perfect',      'quiz',   'Perfect Score',     'Get all answers right in a quiz',        35,   8, 2, '/courses', 'tile-orange', 'star',       11, true),
  ('streak-master',     'quiz',   'Streak Master',     'Keep your daily streak going',           30, NULL, 5, NULL,      'tile-yellow', 'star',       12, true)
ON CONFLICT (id) DO NOTHING;
