-- =============================================================================
-- CraftWords — Courses module seed data
-- Run this AFTER supabase-courses-schema.sql in Supabase SQL Editor.
--
-- Populates:
--   * 8 courses  (mirrors the original CourseList mock 1:1, ids are slugs)
--   * 4 demo lessons  (3 video segments + 1 reading passage)
--   * 11 vocab entries used by the lesson highlight_words
--   * 4 multiple-choice quiz questions (one per demo lesson)
--
-- All values are upserted (insert ... on conflict do update) so you can rerun
-- this script safely after editing copy / fixing typos.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 8 courses (sort_order 1..8 mirrors the legacy numeric mock ids so any
-- /video/1, /reading/2 deep-links can still resolve via sort_order lookup)
-- ----------------------------------------------------------------------------
insert into public.courses (
  id, kind, title, description, difficulty, est_minutes, xp_reward,
  unlock_level, thumbnail_key, source_label, source_url, source_license,
  sort_order, is_active
) values
  ('creeper-sounds-safety', 'listening',
   'Creeper Sounds & Safety',
   'Learn warning words from Minecraft video clips',
   2, 5, 40, 1, 'creeper',
   'English from the Ground Up',
   'https://www.youtube.com/@englishfromthegroundup',
   'youtube-embed',
   1, true),

  ('diamond-sword-recipe', 'reading',
   'How to Craft a Diamond Sword',
   'Read and understand crafting recipes in English',
   1, 4, 30, 1, 'sword',
   'Minecraft Wiki',
   'https://minecraft.wiki/w/Diamond_Sword',
   'CC-BY-SA-4.0',
   2, true),

  ('village-trading-guide', 'listening',
   'Village Trading Guide',
   'Watch and listen to trading conversations',
   3, 8, 60, 3, 'villager',
   'English from the Ground Up',
   'https://www.youtube.com/@englishfromthegroundup',
   'youtube-embed',
   3, true),

  ('biome-explorer-journal', 'reading',
   'Biome Explorer Journal',
   'Read descriptions of different Minecraft biomes',
   2, 6, 45, 2, 'biome',
   'Minecraft Wiki',
   'https://minecraft.wiki/w/Biome',
   'CC-BY-SA-4.0',
   4, true),

  ('mob-encyclopedia', 'vocabulary',
   'Mob Encyclopedia',
   'Learn English names of all Minecraft mobs',
   1, 5, 35, 1, 'mob',
   'Minecraft Wiki',
   'https://minecraft.wiki/w/Mob',
   'CC-BY-SA-4.0',
   5, true),

  ('redstone-engineering', 'listening',
   'Redstone Engineering',
   'Follow instructions to build circuits',
   3, 10, 80, 15, 'redstone',
   'English from the Ground Up',
   'https://www.youtube.com/@englishfromthegroundup',
   'youtube-embed',
   6, true),

  ('enchantment-table-secrets', 'reading',
   'Enchantment Table Secrets',
   'Decode enchantment descriptions in English',
   3, 7, 70, 20, 'enchant',
   'Minecraft Wiki',
   'https://minecraft.wiki/w/Enchanting_Table',
   'CC-BY-SA-4.0',
   7, true),

  ('building-materials', 'vocabulary',
   'Building Materials',
   'Match blocks to their English names',
   1, 3, 25, 1, 'blocks',
   'Minecraft Wiki',
   'https://minecraft.wiki/w/Block',
   'CC-BY-SA-4.0',
   8, true)
on conflict (id) do update set
  kind = excluded.kind,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  est_minutes = excluded.est_minutes,
  xp_reward = excluded.xp_reward,
  unlock_level = excluded.unlock_level,
  thumbnail_key = excluded.thumbnail_key,
  source_label = excluded.source_label,
  source_url = excluded.source_url,
  source_license = excluded.source_license,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- ----------------------------------------------------------------------------
-- Demo lesson #1: a single video segment for creeper-sounds-safety
--
-- transcript_en is an A2-level teaching paraphrase written by CraftWords for
-- the Minecraft creeper safety topic. It is NOT a transcript of the YouTube
-- captions; we never store/redistribute YouTube caption text.
--
-- yt_video_id: 'fdP-zeNxvVQ' is the real EFTGU video
--   "Learn English with Minecraft Hardcore #1 – My First Night"
--   https://www.youtube.com/watch?v=fdP-zeNxvVQ
-- The first ~90s covers the player's first night when creepers spawn,
-- which thematically matches CraftWords' creeper safety paraphrase below.
-- transcript_en remains a CraftWords original A2 paraphrase (NOT a YT caption
-- transcription) per CC compliance — we never store/redistribute YT captions.
-- ----------------------------------------------------------------------------
insert into public.lessons (
  id, course_id, step_index, kind, title,
  yt_video_id, yt_start_sec, yt_end_sec,
  transcript_en, transcript_zh, highlight_words, xp_reward
) values (
  'creeper-sounds-safety/01',
  'creeper-sounds-safety',
  0,
  'video_segment',
  'Spotting a Creeper',
  'fdP-zeNxvVQ',          -- EFTGU "Minecraft Hardcore #1 – My First Night"
  0,
  90,
  E'Welcome back to Minecraft survival! Today we are going to learn about creepers. Creepers are very dangerous because they explode. When you hear a hissing sound, run away quickly! The best defense is to keep your distance.',
  E'欢迎回到 Minecraft 生存模式！今天我们来学习苦力怕。苦力怕非常危险，因为它们会爆炸。当你听到嘶嘶声时，赶紧跑开！最好的防御就是保持距离。',
  ARRAY['dangerous','explode'],
  20
)
on conflict (id) do update set
  course_id = excluded.course_id,
  step_index = excluded.step_index,
  kind = excluded.kind,
  title = excluded.title,
  yt_video_id = excluded.yt_video_id,
  yt_start_sec = excluded.yt_start_sec,
  yt_end_sec = excluded.yt_end_sec,
  transcript_en = excluded.transcript_en,
  transcript_zh = excluded.transcript_zh,
  highlight_words = excluded.highlight_words,
  xp_reward = excluded.xp_reward;

-- ----------------------------------------------------------------------------
-- Demo lesson #2: a single reading passage for diamond-sword-recipe
--
-- passage_md ends with a CC-BY-SA attribution line as required by the
-- Minecraft Wiki license. The passage paraphrases the wiki's recipe section
-- and is kept under 100 words.
-- ----------------------------------------------------------------------------
insert into public.lessons (
  id, course_id, step_index, kind, title,
  passage_md, transcript_zh, highlight_words, xp_reward
) values (
  'diamond-sword-recipe/01',
  'diamond-sword-recipe',
  0,
  'reading_passage',
  'The Diamond Sword Recipe',
  E'A **diamond sword** is one of the most powerful weapons in Minecraft. To craft one, you need two diamond gems and one stick. Place the stick in the bottom slot of the crafting grid. Stack the two diamonds on top of the stick. The diamond sword deals 7 attack damage and is dangerous to most mobs. With the right enchantments, you can make it even stronger.\n\n_Source: Minecraft Wiki – [Diamond Sword](https://minecraft.wiki/w/Diamond_Sword) (CC BY-SA 4.0)_',
  E'钻石剑是 Minecraft 中最强大的武器之一。制作它需要两颗钻石和一根木棍。把木棍放在合成网格的底部格子里，然后在木棍上方叠放两颗钻石。钻石剑能造成 7 点攻击伤害，对大多数生物来说都很危险。配合合适的附魔，你可以让它更强大。',
  ARRAY['craft','diamond','sword','dangerous'],
  15
)
on conflict (id) do update set
  course_id = excluded.course_id,
  step_index = excluded.step_index,
  kind = excluded.kind,
  title = excluded.title,
  passage_md = excluded.passage_md,
  transcript_zh = excluded.transcript_zh,
  highlight_words = excluded.highlight_words,
  xp_reward = excluded.xp_reward;

-- ----------------------------------------------------------------------------
-- Demo lesson #3: village-trading-guide video segment
--
-- yt_video_id: 'H11VGRQlDrg' — EFTGU "Intermediate English - Minecraft #1"
--   https://www.youtube.com/watch?v=H11VGRQlDrg
-- The opening minutes set up a villager breeder / trading hall, matching
-- CraftWords' A2 paraphrase about villagers and emerald trades.
-- ----------------------------------------------------------------------------
insert into public.lessons (
  id, course_id, step_index, kind, title,
  yt_video_id, yt_start_sec, yt_end_sec,
  transcript_en, transcript_zh, highlight_words, xp_reward
) values (
  'village-trading-guide/01',
  'village-trading-guide',
  0,
  'video_segment',
  'Talking to Villagers',
  'H11VGRQlDrg',          -- EFTGU "Intermediate English - Minecraft #1"
  0,
  120,
  E'Welcome to the village! Villagers are friendly people who live here. You can trade with them to get useful items. Each villager has a different job. To trade, right-click on a villager. You give them emeralds, and they give you items in return.',
  E'欢迎来到村庄！村民是住在这里的友好居民。你可以和他们交易，换取有用的物品。每个村民都有不同的职业。要交易，只要右键点击村民。你给他们绿宝石，他们就把物品给你。',
  ARRAY['village','villager','trade','emerald'],
  30
)
on conflict (id) do update set
  course_id = excluded.course_id,
  step_index = excluded.step_index,
  kind = excluded.kind,
  title = excluded.title,
  yt_video_id = excluded.yt_video_id,
  yt_start_sec = excluded.yt_start_sec,
  yt_end_sec = excluded.yt_end_sec,
  transcript_en = excluded.transcript_en,
  transcript_zh = excluded.transcript_zh,
  highlight_words = excluded.highlight_words,
  xp_reward = excluded.xp_reward;

-- ----------------------------------------------------------------------------
-- Demo lesson #4: redstone-engineering video segment
--
-- yt_video_id: '5tG-IIwkKwc' — EFTGU "Learn English with Minecraft #26 - Automatic Farm"
--   https://www.youtube.com/watch?v=5tG-IIwkKwc
-- Automatic farms are powered by redstone, so the clip pairs with CraftWords'
-- A2 redstone primer below.
-- ----------------------------------------------------------------------------
insert into public.lessons (
  id, course_id, step_index, kind, title,
  yt_video_id, yt_start_sec, yt_end_sec,
  transcript_en, transcript_zh, highlight_words, xp_reward
) values (
  'redstone-engineering/01',
  'redstone-engineering',
  0,
  'video_segment',
  'Powering Your First Circuit',
  '5tG-IIwkKwc',          -- EFTGU "Minecraft #26 - Automatic Farm"
  0,
  120,
  E'Today let\'s build a simple machine using redstone. Redstone is a special material that carries power. We can use levers and buttons to control machines. First, place a line of redstone dust on the floor. Then connect a lever to one end. When you flip the lever, the redstone wire turns red and powers your circuit!',
  E'今天我们用红石搭一个简单的机器。红石是一种能传导能量的特殊材料。我们可以用拉杆和按钮控制机器。先在地面铺一条红石粉。然后在一端连接一个拉杆。拉下拉杆时，红石线就会变红，给你的电路供电！',
  ARRAY['redstone','lever','circuit','power'],
  40
)
on conflict (id) do update set
  course_id = excluded.course_id,
  step_index = excluded.step_index,
  kind = excluded.kind,
  title = excluded.title,
  yt_video_id = excluded.yt_video_id,
  yt_start_sec = excluded.yt_start_sec,
  yt_end_sec = excluded.yt_end_sec,
  transcript_en = excluded.transcript_en,
  transcript_zh = excluded.transcript_zh,
  highlight_words = excluded.highlight_words,
  xp_reward = excluded.xp_reward;

-- ----------------------------------------------------------------------------
-- 5 core vocab entries (matched to the demo lessons' highlight_words)
-- ----------------------------------------------------------------------------
insert into public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon) values
  ('dangerous', 'dangerous', 'adj',
   'Likely to cause harm or injury.',
   '危险的；可能造成伤害的。',
   'Creepers are very dangerous because they explode.',
   '苦力怕非常危险，因为它们会爆炸。',
   null),
  ('explode', 'explode', 'verb',
   'To burst suddenly with great force.',
   '爆炸；猛然炸开。',
   'The TNT will explode if you light it.',
   '如果你点燃 TNT，它就会爆炸。',
   null),
  ('craft', 'craft', 'verb',
   'To make something by combining materials.',
   '制作；用材料合成物品。',
   'You can craft a pickaxe from sticks and stone.',
   '你可以用木棍和石头合成一把镐。',
   null),
  ('diamond', 'diamond', 'noun',
   'A valuable, very hard gem found deep underground.',
   '钻石；一种贵重坚硬、深埋地下的宝石。',
   'I found three diamonds while mining today.',
   '今天挖矿时我找到了三颗钻石。',
   'enchant'),
  ('sword', 'sword', 'noun',
   'A long, sharp weapon used to fight mobs.',
   '剑；用来对付生物的长形锋利武器。',
   'A diamond sword deals more damage than an iron sword.',
   '钻石剑比铁剑造成的伤害更高。',
   'sword'),
  ('village', 'village', 'noun',
   'A small place where people live, smaller than a town.',
   '村庄；人们居住的小于城镇的地方。',
   'I built my house near a desert village.',
   '我把房子盖在了一个沙漠村庄附近。',
   null),
  ('villager', 'villager', 'noun',
   'A friendly person who lives in a village.',
   '村民；住在村庄里的友好居民。',
   'The villager wanted three emeralds for one book.',
   '这个村民要三颗绿宝石才肯换一本书。',
   null),
  ('trade', 'trade', 'verb',
   'To exchange one thing for another.',
   '交易；用一样东西交换另一样。',
   'I will trade wheat for an emerald.',
   '我要用小麦换一颗绿宝石。',
   null),
  ('emerald', 'emerald', 'noun',
   'A bright green gem used as money in villages.',
   '绿宝石；鲜亮的绿色宝石，在村庄里当作货币。',
   'The villager gave me three emeralds for my carrots.',
   '村民用三颗绿宝石买下了我的胡萝卜。',
   null),
  ('redstone', 'redstone', 'noun',
   'A special red dust that carries power in Minecraft.',
   '红石；Minecraft 中能传导能量的特殊红色粉末。',
   'I used redstone to open the iron door.',
   '我用红石控制铁门开合。',
   null),
  ('lever', 'lever', 'noun',
   'A small switch you can flip up or down to send power.',
   '拉杆；可以上下拨动以接通能量的小开关。',
   'Flip the lever to open the trapdoor.',
   '拉下拉杆就能打开陷阱门。',
   null),
  ('circuit', 'circuit', 'noun',
   'A path that power flows through to make machines work.',
   '电路；能量流过、驱动机器工作的路径。',
   'A simple redstone circuit can light up a lamp.',
   '一个简单的红石电路就能点亮灯。',
   null),
  ('power', 'power', 'noun',
   'The energy that makes a machine or circuit work.',
   '能量；驱动机器或电路运转的能源。',
   'The lever sends power to the lamp.',
   '拉杆给灯传送能量。',
   null)
on conflict (id) do update set
  word = excluded.word,
  pos = excluded.pos,
  definition_en = excluded.definition_en,
  definition_zh = excluded.definition_zh,
  example_en = excluded.example_en,
  example_zh = excluded.example_zh,
  pixel_icon = excluded.pixel_icon;

-- ----------------------------------------------------------------------------
-- 2 multiple-choice quiz questions (one per demo lesson)
--
-- payload schema for kind='mcq':
--   { "options": [string,string,string,string], "correct": 0..3 }
-- ----------------------------------------------------------------------------
-- Clean any previous demo questions first so reruns don't accumulate dups
delete from public.questions
  where lesson_id in (
    'creeper-sounds-safety/01',
    'diamond-sword-recipe/01',
    'village-trading-guide/01',
    'redstone-engineering/01'
  );

insert into public.questions (lesson_id, kind, prompt, payload, xp_reward, sort_order) values
  ('creeper-sounds-safety/01', 'mcq',
   'What sound does a creeper make before it explodes?',
   '{"options":["A roar","A hissing sound","A clicking noise","No sound at all"],"correct":1}'::jsonb,
   5, 0),
  ('diamond-sword-recipe/01', 'mcq',
   'How many diamonds do you need to craft a diamond sword?',
   '{"options":["One","Two","Three","Four"],"correct":1}'::jsonb,
   5, 0),
  ('village-trading-guide/01', 'mcq',
   'What do you give villagers when you trade with them?',
   '{"options":["Diamonds","Emeralds","Iron ingots","Gold nuggets"],"correct":1}'::jsonb,
   5, 0),
  ('redstone-engineering/01', 'mcq',
   'What does redstone do in Minecraft?',
   '{"options":["It heals animals","It carries power","It only gives light","It cooks food"],"correct":1}'::jsonb,
   5, 0);

-- =============================================================================
-- Done. Verify with:
--   select id, kind, title, sort_order from public.courses order by sort_order;
--   select id, course_id, kind, title from public.lessons;
--   select id, word, pos from public.vocab;
--   select lesson_id, kind, prompt from public.questions;
-- =============================================================================
