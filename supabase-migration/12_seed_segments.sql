-- =============================================================================
-- 12 — Seed: lesson_segments (P2) + multi-quiz-type updates (P3)
--
-- Source:
--   * supabase-courses-segments.sql      (INSERT for 3 video lessons)
--   * supabase-courses-segments-v2.sql   (UPDATE creeper-sounds-safety/01 to mixed types)
--
-- Idempotent via ON CONFLICT (lesson_id, sort_order) DO UPDATE.
-- Run AFTER 09_seed_courses.sql so the parent `lessons` rows exist.
-- =============================================================================

-- ---- creeper-sounds-safety/01 : clip 0..90s, 5 sentences -> span 18s each ----
INSERT INTO public.lesson_segments (
  lesson_id, sort_order, start_sec, end_sec, sentence_en, sentence_zh, blank_word, qtype
) VALUES
  ('creeper-sounds-safety/01', 0,  0,  18,
   'Welcome back to Minecraft survival!',
   E'欢迎回到 Minecraft 生存模式！',
   'minecraft', 'cloze'),
  ('creeper-sounds-safety/01', 1, 18,  36,
   'Today we are going to learn about creepers.',
   E'今天我们来学习苦力怕。',
   'creepers', 'cloze'),
  ('creeper-sounds-safety/01', 2, 36,  54,
   'Creepers are very dangerous because they explode.',
   E'苦力怕非常危险，因为它们会爆炸。',
   'dangerous', 'cloze'),
  ('creeper-sounds-safety/01', 3, 54,  72,
   'When you hear a hissing sound, run away quickly!',
   E'当你听到嘶嘶声时，赶紧跑开！',
   'hissing', 'cloze'),
  ('creeper-sounds-safety/01', 4, 72,  90,
   'The best defense is to keep your distance.',
   E'最好的防御就是保持距离。',
   'distance', 'cloze')
ON CONFLICT (lesson_id, sort_order) DO UPDATE SET
  start_sec   = EXCLUDED.start_sec,
  end_sec     = EXCLUDED.end_sec,
  sentence_en = EXCLUDED.sentence_en,
  sentence_zh = EXCLUDED.sentence_zh,
  blank_word  = EXCLUDED.blank_word,
  qtype       = EXCLUDED.qtype;

-- ---- village-trading-guide/01 : clip 0..120s, 6 sentences -> span 20s each --
INSERT INTO public.lesson_segments (
  lesson_id, sort_order, start_sec, end_sec, sentence_en, sentence_zh, blank_word, qtype
) VALUES
  ('village-trading-guide/01', 0,   0,  20,
   'Welcome to the village!',
   E'欢迎来到村庄！',
   'village', 'cloze'),
  ('village-trading-guide/01', 1,  20,  40,
   'Villagers are friendly people who live here.',
   E'村民是住在这里的友好居民。',
   'villagers', 'cloze'),
  ('village-trading-guide/01', 2,  40,  60,
   'You can trade with them to get useful items.',
   E'你可以和他们交易，换取有用的物品。',
   'trade', 'cloze'),
  ('village-trading-guide/01', 3,  60,  80,
   'Each villager has a different job.',
   E'每个村民都有不同的职业。',
   'villager', 'cloze'),
  ('village-trading-guide/01', 4,  80, 100,
   'To trade, right-click on a villager.',
   E'要交易，只要右键点击村民。',
   'trade', 'cloze'),
  ('village-trading-guide/01', 5, 100, 120,
   'You give them emeralds, and they give you items in return.',
   E'你给他们绿宝石，他们就把物品给你。',
   'emeralds', 'cloze')
ON CONFLICT (lesson_id, sort_order) DO UPDATE SET
  start_sec   = EXCLUDED.start_sec,
  end_sec     = EXCLUDED.end_sec,
  sentence_en = EXCLUDED.sentence_en,
  sentence_zh = EXCLUDED.sentence_zh,
  blank_word  = EXCLUDED.blank_word,
  qtype       = EXCLUDED.qtype;

-- ---- redstone-engineering/01 : clip 0..120s, 6 sentences -> span 20s each ---
INSERT INTO public.lesson_segments (
  lesson_id, sort_order, start_sec, end_sec, sentence_en, sentence_zh, blank_word, qtype
) VALUES
  ('redstone-engineering/01', 0,   0,  20,
   E'Today let\'s build a simple machine using redstone.',
   E'今天我们用红石搭一个简单的机器。',
   'redstone', 'cloze'),
  ('redstone-engineering/01', 1,  20,  40,
   'Redstone is a special material that carries power.',
   E'红石是一种能传导能量的特殊材料。',
   'redstone', 'cloze'),
  ('redstone-engineering/01', 2,  40,  60,
   'We can use levers and buttons to control machines.',
   E'我们可以用拉杆和按钮控制机器。',
   'machines', 'cloze'),
  ('redstone-engineering/01', 3,  60,  80,
   'First, place a line of redstone dust on the floor.',
   E'先在地面铺一条红石粉。',
   'redstone', 'cloze'),
  ('redstone-engineering/01', 4,  80, 100,
   'Then connect a lever to one end.',
   E'然后在一端连接一个拉杆。',
   'lever', 'cloze'),
  ('redstone-engineering/01', 5, 100, 120,
   'When you flip the lever, the redstone wire turns red and powers your circuit!',
   E'拉下拉杆时，红石线就会变红，给你的电路供电！',
   'redstone', 'cloze')
ON CONFLICT (lesson_id, sort_order) DO UPDATE SET
  start_sec   = EXCLUDED.start_sec,
  end_sec     = EXCLUDED.end_sec,
  sentence_en = EXCLUDED.sentence_en,
  sentence_zh = EXCLUDED.sentence_zh,
  blank_word  = EXCLUDED.blank_word,
  qtype       = EXCLUDED.qtype;

-- =============================================================================
-- P3 — convert creeper-sounds-safety/01 segments 1/2/4 to mixed quiz types.
-- Segment 0 stays as cloze 'minecraft'; segment 3 stays as cloze 'hissing'.
-- =============================================================================

-- Segment 1: comprehension (was cloze 'creepers')
UPDATE public.lesson_segments SET
  qtype        = 'comprehension',
  blank_word   = NULL,
  quiz_payload = '{
    "prompt": "What is this segment about?",
    "options": ["Learning about creepers", "Building a house", "Finding diamonds", "Taming a wolf"],
    "correct": 0
  }'::jsonb
WHERE lesson_id = 'creeper-sounds-safety/01' AND sort_order = 1;

-- Segment 2: true_false (was cloze 'dangerous')
UPDATE public.lesson_segments SET
  qtype        = 'true_false',
  blank_word   = NULL,
  quiz_payload = '{
    "statement": "Creepers are friendly mobs that will not hurt you.",
    "correct": false
  }'::jsonb
WHERE lesson_id = 'creeper-sounds-safety/01' AND sort_order = 2;

-- Segment 4: detail_mcq (was cloze 'distance')
UPDATE public.lesson_segments SET
  qtype        = 'detail_mcq',
  blank_word   = NULL,
  quiz_payload = '{
    "prompt": "What is the best defense against creepers?",
    "options": ["Keep your distance", "Attack them first", "Build a wall", "Use a shield"],
    "correct": 0
  }'::jsonb
WHERE lesson_id = 'creeper-sounds-safety/01' AND sort_order = 4;
