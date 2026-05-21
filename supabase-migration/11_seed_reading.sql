-- =============================================================================
-- CraftWords — Reading Courses Seed Data (P4: Segmented Reading)
-- Run AFTER supabase-courses-segments-v2.sql and supabase-admin-rls.sql.
--
-- Changes:
--   1. Expands lesson_segments.qtype to include reading-specific quiz types.
--   2. Inserts 3 reading courses + 3 lessons + 13 segments + vocab + questions.
--
-- All values are upserted so this script can be safely re-run.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) Expand qtype CHECK constraint to include reading-specific types
-- ----------------------------------------------------------------------------
ALTER TABLE public.lesson_segments DROP CONSTRAINT IF EXISTS lesson_segments_qtype_check;
ALTER TABLE public.lesson_segments ADD CONSTRAINT lesson_segments_qtype_check
  CHECK (qtype IN (
    -- listening types (existing)
    'cloze',
    'comprehension',
    'detail_mcq',
    'true_false',
    'sound_match',
    'speaker_intent',
    'phonetic_pair',
    -- reading types (new)
    'vocabulary_cloze',
    'word_match',
    'sentence_order',
    -- shared
    'none'
  ));

-- ============================================================================
-- 2) Three reading courses
-- ============================================================================
INSERT INTO public.courses (
  id, kind, title, description, difficulty, est_minutes, xp_reward,
  unlock_level, thumbnail_key, source_label, source_url, source_license,
  sort_order, is_active
) VALUES
  ('tame-a-wolf', 'reading',
   'How to Tame a Wolf',
   'Learn about wolves and how to make them your pets',
   1, 4, 30, 1, 'mob',
   'Minecraft Wiki',
   'https://minecraft.wiki/w/Wolf',
   'CC-BY-SA-4.0',
   9, true),

  ('lost-village', 'reading',
   'The Lost Village',
   'An original Minecraft adventure — explore and survive!',
   2, 6, 45, 2, 'villager',
   'CraftWords Original',
   NULL,
   'original',
   10, true),

  ('nether-portal-guide', 'reading',
   'Nether Portal Guide',
   'Learn how to build a portal and travel to the Nether',
   2, 5, 40, 3, 'redstone',
   'Minecraft Wiki',
   'https://minecraft.wiki/w/Nether_Portal',
   'CC-BY-SA-4.0',
   11, true)
ON CONFLICT (id) DO UPDATE SET
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

-- ============================================================================
-- 3) Lessons — one reading_passage per course
-- ============================================================================

-- ---- Course A: How to Tame a Wolf ----
INSERT INTO public.lessons (
  id, course_id, step_index, kind, title,
  passage_md, transcript_zh, highlight_words, xp_reward
) VALUES (
  'tame-a-wolf/01',
  'tame-a-wolf',
  0,
  'reading_passage',
  'Wolves, Bones & Collars',
  E'Wolves are **neutral** mobs that live in forest and taiga biomes. They will not attack you unless you hit them first. If you attack one wolf, all nearby wolves become **hostile** and will try to fight you.\n\nTo **tame** a wolf, you need to feed it bones. Bones are dropped by skeletons when you defeat them. Hold a bone in your hand and right-click on the wolf. Each bone has about a one-third chance of taming the wolf.\n\nWhen a wolf is tamed, it becomes your loyal pet. A red **collar** appears around its neck. You can change the collar color using different dyes. Your tamed wolf will follow you everywhere and help you fight mobs.\n\nTamed wolves have a health bar that appears when they take damage. You can **heal** your wolf by feeding it any kind of meat. Be careful in dangerous areas — your wolf can die if its health reaches zero. Always keep some extra meat in your inventory to keep your pet safe!',
  E'狼是生活在森林和针叶林生物群系中的中立生物。除非你先攻击它们，否则它们不会攻击你。如果你攻击了一只狼，附近所有的狼都会变得充满敌意并试图攻击你。\n\n要驯服一只狼，你需要用骨头喂它。骨头是你打败骷髅后掉落的。手持骨头，右键点击狼。每根骨头大约有三分之一的概率驯服这只狼。\n\n当狼被驯服后，它会成为你忠诚的宠物。它的脖子上会出现一个红色的项圈。你可以用不同的染料改变项圈颜色。你驯服的狼会跟着你到处走，并帮你攻击生物。\n\n驯服的狼有一个生命值条，受伤时会显示出来。你可以喂它任何种类的肉来给它恢复生命。在危险区域要小心——如果你的狼生命值降到零，它会死亡。记得在背包里多带些肉，保护好你的宠物！',
  ARRAY['tame','bone','collar','hostile','neutral'],
  30
)
ON CONFLICT (id) DO UPDATE SET
  course_id = excluded.course_id,
  step_index = excluded.step_index,
  kind = excluded.kind,
  title = excluded.title,
  passage_md = excluded.passage_md,
  transcript_zh = excluded.transcript_zh,
  highlight_words = excluded.highlight_words,
  xp_reward = excluded.xp_reward;

-- ---- Course B: The Lost Village ----
INSERT INTO public.lessons (
  id, course_id, step_index, kind, title,
  passage_md, transcript_zh, highlight_words, xp_reward
) VALUES (
  'lost-village/01',
  'lost-village',
  0,
  'reading_passage',
  'The Abandoned Village',
  E'Alex was exploring a dark forest when she saw something strange through the trees. It was a **village**, but it looked very old and empty. No villagers were walking in the streets. The houses had broken windows, and tall grass grew between the paths. It was an **abandoned** village.\n\nAlex walked into the largest house and looked around. In the corner, she found an old wooden **chest**. She opened it slowly. Inside, there were three iron ingots, some bread, and a map. The map showed a red cross near a mountain. "Maybe this leads to something special," she thought.\n\nAlex followed the map through caves and rivers. The journey was long, but she kept going. She placed **torches** on the cave walls so she would not get lost in the dark. After many hours, she finally reached the mountain marked on the map.\n\nInside the mountain, Alex discovered a hidden room filled with glowing blocks. There was a sign on the wall that read: "Only the brave may take the treasure." She looked down and saw a deep pit of lava below. **Survival** would not be easy here.\n\nAlex built a bridge across the lava using cobblestone blocks. She moved carefully, one block at a time. On the other side, she found a chest with a diamond pickaxe and a golden apple inside. She smiled and whispered, "This adventure was worth every step." Then she headed home to her own village.',
  E'Alex 正在探索一片黑暗森林时，她透过树丛看到了一些奇怪的东西。那是一个村庄，但看起来非常古老而且空无一人。没有村民在街上走动。房屋的窗户破碎了，高草长满了小路之间。这是一座废弃的村庄。\n\nAlex 走进最大的那座房屋，环顾四周。在角落里，她发现了一个古老的木箱。她慢慢打开它。里面有三块铁锭、一些面包和一张地图。地图上在一座山附近标了一个红十字。"也许这会通向什么特别的地方，"她想。\n\nAlex 沿着地图穿过山洞和河流。旅途很长，但她坚持前行。她在洞壁上放置了火把，这样就不会在黑暗中迷路。走了很多个小时后，她终于到达了地图上标记的那座山。\n\n在山的内部，Alex 发现了一个隐藏的房间，里面充满了发光的方块。墙上有一个标牌写着："只有勇敢的人才能拿走宝藏。"她低头看到脚下有一个深深的熔岩坑。在这里生存可不容易。\n\nAlex 用圆石方块在熔岩上架了一座桥。她小心翼翼地走着，一块一块地移动。在另一边，她发现了一个箱子，里面有一把钻石镐和一个金苹果。她微笑着低声说："这次冒险每一步都值得。"然后她朝自己的村庄踏上了归途。',
  ARRAY['village','abandoned','chest','torch','survival'],
  45
)
ON CONFLICT (id) DO UPDATE SET
  course_id = excluded.course_id,
  step_index = excluded.step_index,
  kind = excluded.kind,
  title = excluded.title,
  passage_md = excluded.passage_md,
  transcript_zh = excluded.transcript_zh,
  highlight_words = excluded.highlight_words,
  xp_reward = excluded.xp_reward;

-- ---- Course C: Nether Portal Guide ----
INSERT INTO public.lessons (
  id, course_id, step_index, kind, title,
  passage_md, transcript_zh, highlight_words, xp_reward
) VALUES (
  'nether-portal-guide/01',
  'nether-portal-guide',
  0,
  'reading_passage',
  'Building Your First Portal',
  E'The **Nether** is a dangerous **dimension** in Minecraft. It is like a different world filled with fire, lava, and scary mobs. To travel to the Nether, you need to build a special doorway called a Nether **Portal**. The portal is made from a dark purple rock called **obsidian**.\n\nTo get obsidian, you need a diamond pickaxe. Obsidian is formed when water flows over lava. It is one of the hardest blocks in the game and takes a long time to mine. You need at least ten blocks of obsidian to build the portal frame — four blocks wide and five blocks tall.\n\nAfter building the frame, you need to light the portal using **flint** and steel. When you strike the flint and steel inside the frame, purple flames appear in the center. Step into the purple fire and wait a few seconds. You will be transported to the Nether! Remember: always bring extra obsidian and flint so you can build a portal back home.\n\nThe Nether has many useful resources, but it is full of danger. Ghasts shoot fireballs at you, and zombie piglins guard gold. The ground is made of netherrack, which burns forever once lit. Experienced players often travel to the Nether to find rare materials like blaze rods and nether wart for making potions.',
  E'下界是 Minecraft 中一个危险的维度。它就像一个充满火焰、熔岩和可怕生物的不同世界。要前往下界，你需要建造一个叫做下界传送门的特殊通道。传送门由一种叫做黑曜石的深紫色岩石制成。\n\n要获取黑曜石，你需要一把钻石镐。当水流过熔岩时就会形成黑曜石。它是游戏中最坚硬的方块之一，开采需要很长时间。你至少需要十块黑曜石来建造传送门框架——四块宽、五块高。\n\n建好框架后，你需要用打火石点燃传送门。当你在框架内使用打火石时，中间会出现紫色火焰。走进紫色火焰，等待几秒钟。你就会被传送到下界！记住：一定要多带一些黑曜石和打火石，这样你可以在那边建一个回家的传送门。\n\n下界有很多有用的资源，但也充满了危险。恶魂会向你射火球，僵尸猪灵守卫着黄金。地面由地狱岩构成，一旦点燃就会永远燃烧。有经验的玩家经常前往下界寻找稀有材料，如烈焰棒和地狱疣，用来酿造药水。',
  ARRAY['obsidian','portal','flint','dimension','nether'],
  40
)
ON CONFLICT (id) DO UPDATE SET
  course_id = excluded.course_id,
  step_index = excluded.step_index,
  kind = excluded.kind,
  title = excluded.title,
  passage_md = excluded.passage_md,
  transcript_zh = excluded.transcript_zh,
  highlight_words = excluded.highlight_words,
  xp_reward = excluded.xp_reward;

-- ============================================================================
-- 4) Lesson Segments — reading paragraphs with per-segment quizzes
--
-- For reading courses, start_sec/end_sec are 0 (no video timing).
-- sentence_en holds the paragraph text; sentence_zh is the translation
-- revealed after answering correctly.
-- ============================================================================

-- ---- tame-a-wolf/01 : 4 segments ----
-- Segment 0: vocabulary_cloze — blank_word = "neutral"
INSERT INTO public.lesson_segments (
  lesson_id, sort_order, start_sec, end_sec,
  sentence_en, sentence_zh, blank_word, distractors, qtype, quiz_payload
) VALUES
  ('tame-a-wolf/01', 0, 0, 0,
   'Wolves are **neutral** mobs that live in forest and taiga biomes. They will not attack you unless you hit them first. If you attack one wolf, all nearby wolves become **hostile** and will try to fight you.',
   E'狼是生活在森林和针叶林生物群系中的中立生物。除非你先攻击它们，否则它们不会攻击你。如果你攻击了一只狼，附近所有的狼都会变得充满敌意并试图攻击你。',
   'neutral', ARRAY['hostile','passive','friendly'],
   'vocabulary_cloze', NULL),

  -- Segment 1: comprehension
  ('tame-a-wolf/01', 1, 0, 0,
   'To **tame** a wolf, you need to feed it bones. Bones are dropped by skeletons when you defeat them. Hold a bone in your hand and right-click on the wolf. Each bone has about a one-third chance of taming the wolf.',
   E'要驯服一只狼，你需要用骨头喂它。骨头是你打败骷髅后掉落的。手持骨头，右键点击狼。每根骨头大约有三分之一的概率驯服这只狼。',
   NULL, '{}',
   'comprehension',
   '{"prompt":"What do you need to tame a wolf?","options":["Bones","Meat","Fish","Sticks"],"correct":0}'::jsonb),

  -- Segment 2: true_false
  ('tame-a-wolf/01', 2, 0, 0,
   'When a wolf is tamed, it becomes your loyal pet. A red **collar** appears around its neck. You can change the collar color using different dyes. Your tamed wolf will follow you everywhere and help you fight mobs.',
   E'当狼被驯服后，它会成为你忠诚的宠物。它的脖子上会出现一个红色的项圈。你可以用不同的染料改变项圈颜色。你驯服的狼会跟着你到处走，并帮你攻击生物。',
   NULL, '{}',
   'true_false',
   '{"statement":"A tamed wolf wears a blue collar by default.","correct":false}'::jsonb),

  -- Segment 3: vocabulary_cloze — blank_word = "heal"
  ('tame-a-wolf/01', 3, 0, 0,
   'Tamed wolves have a health bar that appears when they take damage. You can **heal** your wolf by feeding it any kind of meat. Be careful in dangerous areas — your wolf can die if its health reaches zero. Always keep some extra meat in your inventory to keep your pet safe!',
   E'驯服的狼有一个生命值条，受伤时会显示出来。你可以喂它任何种类的肉来给它恢复生命。在危险区域要小心——如果你的狼生命值降到零，它会死亡。记得在背包里多带些肉，保护好你的宠物！',
   'heal', ARRAY['hurt','feed','tame'],
   'vocabulary_cloze', NULL)
ON CONFLICT (lesson_id, sort_order) DO UPDATE SET
  start_sec   = excluded.start_sec,
  end_sec     = excluded.end_sec,
  sentence_en = excluded.sentence_en,
  sentence_zh = excluded.sentence_zh,
  blank_word  = excluded.blank_word,
  distractors = excluded.distractors,
  qtype       = excluded.qtype,
  quiz_payload = excluded.quiz_payload;

-- ---- lost-village/01 : 5 segments ----
INSERT INTO public.lesson_segments (
  lesson_id, sort_order, start_sec, end_sec,
  sentence_en, sentence_zh, blank_word, distractors, qtype, quiz_payload
) VALUES
  -- Segment 0: comprehension
  ('lost-village/01', 0, 0, 0,
   'Alex was exploring a dark forest when she saw something strange through the trees. It was a **village**, but it looked very old and empty. No villagers were walking in the streets. The houses had broken windows, and tall grass grew between the paths. It was an **abandoned** village.',
   E'Alex 正在探索一片黑暗森林时，她透过树丛看到了一些奇怪的东西。那是一个村庄，但看起来非常古老而且空无一人。没有村民在街上走动。房屋的窗户破碎了，高草长满了小路之间。这是一座废弃的村庄。',
   NULL, '{}',
   'comprehension',
   '{"prompt":"What did Alex find in the forest?","options":["An abandoned village","A hidden cave","A treasure chest","A friendly villager"],"correct":0}'::jsonb),

  -- Segment 1: vocabulary_cloze — blank_word = "chest"
  ('lost-village/01', 1, 0, 0,
   'Alex walked into the largest house and looked around. In the corner, she found an old wooden **chest**. She opened it slowly. Inside, there were three iron ingots, some bread, and a map. The map showed a red cross near a mountain. "Maybe this leads to something special," she thought.',
   E'Alex 走进最大的那座房屋，环顾四周。在角落里，她发现了一个古老的木箱。她慢慢打开它。里面有三块铁锭、一些面包和一张地图。地图上在一座山附近标了一个红十字。"也许这会通向什么特别的地方，"她想。',
   'chest', ARRAY['box','barrel','shelf'],
   'vocabulary_cloze', NULL),

  -- Segment 2: sentence_order
  ('lost-village/01', 2, 0, 0,
   'Alex followed the map through caves and rivers. The journey was long, but she kept going. She placed **torches** on the cave walls so she would not get lost in the dark. After many hours, she finally reached the mountain marked on the map.',
   E'Alex 沿着地图穿过山洞和河流。旅途很长，但她坚持前行。她在洞壁上放置了火把，这样就不会在黑暗中迷路。走了很多个小时后，她终于到达了地图上标记的那座山。',
   NULL, '{}',
   'sentence_order',
   '{"sentences":["Alex found a map inside the chest.","She followed the map through caves and rivers.","She placed torches on the cave walls.","She reached the mountain on the map."],"correct_order":[0,1,2,3]}'::jsonb),

  -- Segment 3: true_false
  ('lost-village/01', 3, 0, 0,
   'Inside the mountain, Alex discovered a hidden room filled with glowing blocks. There was a sign on the wall that read: "Only the brave may take the treasure." She looked down and saw a deep pit of lava below. **Survival** would not be easy here.',
   E'在山的内部，Alex 发现了一个隐藏的房间，里面充满了发光的方块。墙上有一个标牌写着："只有勇敢的人才能拿走宝藏。"她低头看到脚下有一个深深的熔岩坑。在这里生存可不容易。',
   NULL, '{}',
   'true_false',
   '{"statement":"The hidden room was completely safe with no dangers.","correct":false}'::jsonb),

  -- Segment 4: comprehension
  ('lost-village/01', 4, 0, 0,
   'Alex built a bridge across the lava using cobblestone blocks. She moved carefully, one block at a time. On the other side, she found a chest with a diamond pickaxe and a golden apple inside. She smiled and whispered, "This adventure was worth every step." Then she headed home to her own village.',
   E'Alex 用圆石方块在熔岩上架了一座桥。她小心翼翼地走着，一块一块地移动。在另一边，她发现了一个箱子，里面有一把钻石镐和一个金苹果。她微笑着低声说："这次冒险每一步都值得。"然后她朝自己的村庄踏上了归途。',
   NULL, '{}',
   'comprehension',
   '{"prompt":"What did Alex find on the other side of the lava?","options":["A diamond pickaxe and a golden apple","A diamond sword","An enchantment table","More lava and nothing else"],"correct":0}'::jsonb)
ON CONFLICT (lesson_id, sort_order) DO UPDATE SET
  start_sec   = excluded.start_sec,
  end_sec     = excluded.end_sec,
  sentence_en = excluded.sentence_en,
  sentence_zh = excluded.sentence_zh,
  blank_word  = excluded.blank_word,
  distractors = excluded.distractors,
  qtype       = excluded.qtype,
  quiz_payload = excluded.quiz_payload;

-- ---- nether-portal-guide/01 : 4 segments ----
INSERT INTO public.lesson_segments (
  lesson_id, sort_order, start_sec, end_sec,
  sentence_en, sentence_zh, blank_word, distractors, qtype, quiz_payload
) VALUES
  -- Segment 0: true_false
  ('nether-portal-guide/01', 0, 0, 0,
   'The **Nether** is a dangerous **dimension** in Minecraft. It is like a different world filled with fire, lava, and scary mobs. To travel to the Nether, you need to build a special doorway called a Nether **Portal**. The portal is made from a dark purple rock called **obsidian**.',
   E'下界是 Minecraft 中一个危险的维度。它就像一个充满火焰、熔岩和可怕生物的不同世界。要前往下界，你需要建造一个叫做下界传送门的特殊通道。传送门由一种叫做黑曜石的深紫色岩石制成。',
   NULL, '{}',
   'true_false',
   '{"statement":"The Nether Portal is made from diamond blocks.","correct":false}'::jsonb),

  -- Segment 1: vocabulary_cloze — blank_word = "obsidian"
  ('nether-portal-guide/01', 1, 0, 0,
   'To get **obsidian**, you need a diamond pickaxe. Obsidian is formed when water flows over lava. It is one of the hardest blocks in the game and takes a long time to mine. You need at least ten blocks of obsidian to build the portal frame — four blocks wide and five blocks tall.',
   E'要获取黑曜石，你需要一把钻石镐。当水流过熔岩时就会形成黑曜石。它是游戏中最坚硬的方块之一，开采需要很长时间。你至少需要十块黑曜石来建造传送门框架——四块宽、五块高。',
   'obsidian', ARRAY['diamond','cobblestone','iron'],
   'vocabulary_cloze', NULL),

  -- Segment 2: comprehension
  ('nether-portal-guide/01', 2, 0, 0,
   'After building the frame, you need to light the portal using **flint** and steel. When you strike the flint and steel inside the frame, purple flames appear in the center. Step into the purple fire and wait a few seconds. You will be transported to the Nether! Remember: always bring extra obsidian and flint so you can build a portal back home.',
   E'建好框架后，你需要用打火石点燃传送门。当你在框架内使用打火石时，中间会出现紫色火焰。走进紫色火焰，等待几秒钟。你就会被传送到下界！记住：一定要多带一些黑曜石和打火石，这样你可以在那边建一个回家的传送门。',
   NULL, '{}',
   'comprehension',
   '{"prompt":"What do you use to light the Nether Portal?","options":["Flint and steel","A torch","A fire charge","A lava bucket"],"correct":0}'::jsonb),

  -- Segment 3: word_match
  ('nether-portal-guide/01', 3, 0, 0,
   'The Nether has many useful resources, but it is full of danger. Ghasts shoot fireballs at you, and zombie piglins guard gold. The ground is made of netherrack, which burns forever once lit. Experienced players often travel to the Nether to find rare materials like blaze rods and nether wart for making potions.',
   E'下界有很多有用的资源，但也充满了危险。恶魂会向你射火球，僵尸猪灵守卫着黄金。地面由地狱岩构成，一旦点燃就会永远燃烧。有经验的玩家经常前往下界寻找稀有材料，如烈焰棒和地狱疣，用来酿造药水。',
   NULL, '{}',
   'word_match',
   '{"pairs":[{"word":"obsidian","definition":"A dark purple rock used to build portals"},{"word":"nether","definition":"A dangerous fire dimension in Minecraft"},{"word":"flint","definition":"A material used with steel to make fire"},{"word":"dimension","definition":"A separate world you can travel to"}],"shuffled_defs":["A dangerous fire dimension in Minecraft","A material used with steel to make fire","A dark purple rock used to build portals","A separate world you can travel to"]}'::jsonb)
ON CONFLICT (lesson_id, sort_order) DO UPDATE SET
  start_sec   = excluded.start_sec,
  end_sec     = excluded.end_sec,
  sentence_en = excluded.sentence_en,
  sentence_zh = excluded.sentence_zh,
  blank_word  = excluded.blank_word,
  distractors = excluded.distractors,
  qtype       = excluded.qtype,
  quiz_payload = excluded.quiz_payload;

-- ============================================================================
-- 5) Vocab entries for reading highlight_words
-- ============================================================================
INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon) VALUES
  ('tame', 'tame', 'verb',
   'To make a wild animal friendly and obedient.',
   '驯服；使野生动物变得友好和听话。',
   'You can tame a wolf by feeding it bones.',
   '你可以用骨头喂狼来驯服它。',
   NULL),
  ('bone', 'bone', 'noun',
   'A hard white part inside the body; dropped by skeletons.',
   '骨头；身体内部坚硬的白色部分；由骷髅掉落。',
   'I collected five bones from the skeleton.',
   '我从骷髅那里收集了五根骨头。',
   NULL),
  ('collar', 'collar', 'noun',
   'A band worn around the neck of an animal.',
   '项圈；动物脖子上佩戴的环带。',
   'My tamed wolf has a red collar.',
   '我驯服的狼戴着一个红色项圈。',
   NULL),
  ('hostile', 'hostile', 'adj',
   'Unfriendly and ready to attack.',
   '敌对的；不友好并准备攻击的。',
   'Hostile mobs will attack you on sight.',
   '敌对生物一看到你就会发动攻击。',
   NULL),
  ('neutral', 'neutral', 'adj',
   'Not attacking unless provoked first.',
   '中立的；除非被激怒否则不会攻击的。',
   'Wolves are neutral mobs in Minecraft.',
   '狼在 Minecraft 中是中立生物。',
   NULL),
  ('abandoned', 'abandoned', 'adj',
   'Left empty; no longer used by anyone.',
   '废弃的；被遗弃的；不再被任何人使用的。',
   'We found an abandoned village in the dark forest.',
   '我们在黑暗森林中发现了一座废弃的村庄。',
   NULL),
  ('chest', 'chest', 'noun',
   'A wooden box used to store items in Minecraft.',
   '箱子；Minecraft 中用来存放物品的木箱。',
   'I put all my diamonds in the chest.',
   '我把所有的钻石都放进了箱子里。',
   NULL),
  ('torch', 'torch', 'noun',
   'A stick that gives light, used to see in dark places.',
   '火把；能发光的棍子，用于在黑暗处照明。',
   'Place a torch on the wall to light up the cave.',
   '在墙上放一个火把来照亮洞穴。',
   NULL),
  ('survival', 'survival', 'noun',
   'The state of continuing to live, especially in danger.',
   '生存；尤指在危险中继续存活的状态。',
   'Survival mode is the most popular way to play Minecraft.',
   '生存模式是最受欢迎的 Minecraft 玩法。',
   NULL),
  ('obsidian', 'obsidian', 'noun',
   'A very hard, dark purple block formed from water and lava.',
   '黑曜石；由水和熔岩形成的非常坚硬的深紫色方块。',
   'You need obsidian to build a Nether Portal.',
   '你需要黑曜石来建造下界传送门。',
   NULL),
  ('portal', 'portal', 'noun',
   'A doorway that transports you to another dimension.',
   '传送门；将你传送到另一个维度的通道。',
   'Step into the portal to travel to the Nether.',
   '走进传送门前往下界。',
   NULL),
  ('flint', 'flint', 'noun',
   'A grey stone used with steel to start fires.',
   '燧石；与钢搭配使用来点火的灰色石头。',
   'Use flint and steel to light the portal.',
   '用打火石点燃传送门。',
   NULL),
  ('dimension', 'dimension', 'noun',
   'A separate world you can travel to in Minecraft.',
   '维度；Minecraft 中你可以前往的另一个世界。',
   'The Nether is a different dimension from the Overworld.',
   '下界是一个不同于主世界的维度。',
   NULL),
  ('nether', 'nether', 'noun',
   'A fiery underground dimension in Minecraft.',
   '下界；Minecraft 中充满火焰的地下维度。',
   'The Nether is full of lava and dangerous mobs.',
   '下界充满了熔岩和危险的生物。',
   NULL)
ON CONFLICT (id) DO UPDATE SET
  word = excluded.word,
  pos = excluded.pos,
  definition_en = excluded.definition_en,
  definition_zh = excluded.definition_zh,
  example_en = excluded.example_en,
  example_zh = excluded.example_zh,
  pixel_icon = excluded.pixel_icon;

-- ============================================================================
-- 6) Cooldown MCQ questions — one per reading lesson
-- ============================================================================
DELETE FROM public.questions
  WHERE lesson_id IN (
    'tame-a-wolf/01',
    'lost-village/01',
    'nether-portal-guide/01'
  );

INSERT INTO public.questions (lesson_id, kind, prompt, payload, xp_reward, sort_order) VALUES
  ('tame-a-wolf/01', 'mcq',
   'What item do you use to tame a wolf in Minecraft?',
   '{"options":["A bone","A fish","A diamond","An apple"],"correct":0}'::jsonb,
   5, 0),
  ('lost-village/01', 'mcq',
   'What did Alex find at the end of her adventure?',
   '{"options":["A diamond pickaxe and a golden apple","A stack of emeralds","An enchanted bow","A saddle for a horse"],"correct":0}'::jsonb,
   5, 0),
  ('nether-portal-guide/01', 'mcq',
   'How many obsidian blocks do you need at minimum to build a Nether Portal?',
   '{"options":["8","10","12","14"],"correct":1}'::jsonb,
   5, 0);

-- =============================================================================
-- Done. Verify with:
--   SELECT id, kind, title, sort_order FROM public.courses WHERE kind='reading' ORDER BY sort_order;
--   SELECT id, course_id, kind, title FROM public.lessons WHERE kind='reading_passage';
--   SELECT lesson_id, sort_order, qtype, LEFT(sentence_en, 50) FROM public.lesson_segments
--     WHERE lesson_id LIKE 'tame-a-wolf%' OR lesson_id LIKE 'lost-village%' OR lesson_id LIKE 'nether-portal%'
--     ORDER BY lesson_id, sort_order;
-- =============================================================================
