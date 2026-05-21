-- =============================================================
-- CraftWords – Achievements seed data (idempotent)
-- Run once in the Supabase SQL Editor after the achievements
-- table exists. Uses ON CONFLICT ... DO UPDATE so re-running
-- the script is safe and always converges to the latest values.
-- =============================================================

INSERT INTO public.achievements
  (id, name, description, icon, color_token, condition_type, threshold, sort_order, active)
VALUES
  ('first-steps',    'First Steps',    'Complete your first quest',          'pickaxe',    'tile-teal',   'quest_count',  1,   1, true),
  ('word-miner',     'Word Miner',     'Learn 50 new words',                'diamond',    'tile-blue',   'vocab_count',  50,  2, true),
  ('streak-master',  'Streak Master',  'Maintain a 7-day streak',           'fire',       'tile-orange', 'streak',       7,   3, true),
  ('bookworm',       'Bookworm',       'Complete 10 quests',                'book',       'tile-green',  'quest_count',  10,  4, true),
  ('sharp-ears',     'Sharp Ears',     'Complete 15 quests',                'headphones', 'tile-purple', 'quest_count',  15,  5, true),
  ('diamond-hunter', 'Diamond Hunter', 'Maintain a 30-day streak',          'gem',        'tile-blue',   'streak',       30,  6, true),
  ('enchanter',      'Enchanter',      'Master 200 vocabulary words',       'star',       'tile-yellow', 'vocab_count',  200, 7, true),
  ('ender-dragon',   'Ender Dragon',   'Reach level 20 — true mastery!',    'dragon',     'tile-pink',   'level',        20,  8, true)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  description     = EXCLUDED.description,
  icon            = EXCLUDED.icon,
  color_token     = EXCLUDED.color_token,
  condition_type  = EXCLUDED.condition_type,
  threshold       = EXCLUDED.threshold,
  sort_order      = EXCLUDED.sort_order,
  active          = EXCLUDED.active;
