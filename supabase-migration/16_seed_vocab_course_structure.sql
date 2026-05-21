-- =============================================================================
-- 16 — Seed vocabulary course structures: 10 courses + lessons
--
-- Inserts vocabulary courses and their vocab_drill lessons.
-- Uses ON CONFLICT DO UPDATE for idempotency.
-- =============================================================================

-- Course: Hostile Mobs
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  'vocab-hostile-mobs', 'vocabulary', 'Hostile Mobs', 'Learn the names of dangerous creatures that attack at night.',
  2, 8, 30, 1,
  'CraftWords Vocabulary', '', 'original',
  101, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  'vocab-hostile-mobs-lesson-0', 'vocab-hostile-mobs', 0, 'vocab_drill', 'Hostile Mobs',
  ARRAY['creeper', 'zombie', 'skeleton', 'spider', 'enderman', 'ghast', 'blaze', 'dragon'],
  30
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

-- Course: Friendly Animals
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  'vocab-friendly-animals', 'vocabulary', 'Friendly Animals', 'Meet the peaceful creatures you can tame, ride, and breed.',
  2, 8, 30, 1,
  'CraftWords Vocabulary', '', 'original',
  102, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  'vocab-friendly-animals-lesson-0', 'vocab-friendly-animals', 0, 'vocab_drill', 'Friendly Animals',
  ARRAY['horse', 'rabbit', 'ocelot', 'dolphin', 'turtle', 'pig', 'cow', 'sheep'],
  30
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

-- Course: Tools & Weapons
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  'vocab-tools-weapons', 'vocabulary', 'Tools & Weapons', 'Master the essential gear every adventurer needs.',
  3, 10, 35, 1,
  'CraftWords Vocabulary', '', 'original',
  103, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  'vocab-tools-weapons-lesson-0', 'vocab-tools-weapons', 0, 'vocab_drill', 'Tools & Weapons',
  ARRAY['pickaxe', 'sword', 'shovel', 'axe', 'bow', 'arrow', 'shield', 'armor'],
  35
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

-- Course: Precious Resources
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  'vocab-precious-resources', 'vocabulary', 'Precious Resources', 'Discover the valuable ores and gems hidden underground.',
  3, 10, 35, 1,
  'CraftWords Vocabulary', '', 'original',
  104, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  'vocab-precious-resources-lesson-0', 'vocab-precious-resources', 0, 'vocab_drill', 'Precious Resources',
  ARRAY['diamond', 'emerald', 'gold', 'coal', 'redstone', 'netherite', 'iron', 'ore'],
  35
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

-- Course: Food & Cooking
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  'vocab-food-cooking', 'vocabulary', 'Food & Cooking', 'Learn about all the foods that keep your hunger bar full.',
  2, 10, 30, 1,
  'CraftWords Vocabulary', '', 'original',
  105, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  'vocab-food-cooking-lesson-0', 'vocab-food-cooking', 0, 'vocab_drill', 'Food & Cooking',
  ARRAY['bread', 'apple', 'steak', 'salmon', 'cake', 'mushroom', 'wheat', 'carrot', 'potato'],
  30
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

-- Course: Nature & Landscape
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  'vocab-nature-landscape', 'vocabulary', 'Nature & Landscape', 'Explore the different biomes and natural features of the world.',
  3, 10, 35, 1,
  'CraftWords Vocabulary', '', 'original',
  106, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  'vocab-nature-landscape-lesson-0', 'vocab-nature-landscape', 0, 'vocab_drill', 'Nature & Landscape',
  ARRAY['cave', 'ocean', 'forest', 'desert', 'jungle', 'river', 'mountain', 'biome'],
  35
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

-- Course: The Nether & The End
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  'vocab-nether-end', 'vocabulary', 'The Nether & The End', 'Words from the most dangerous dimensions in Minecraft.',
  3, 10, 40, 2,
  'CraftWords Vocabulary', '', 'original',
  107, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  'vocab-nether-end-lesson-0', 'vocab-nether-end', 0, 'vocab_drill', 'The Nether & The End',
  ARRAY['nether', 'portal', 'blaze', 'fortress', 'potion', 'stronghold', 'dragon'],
  40
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

-- Course: Crafting & Machines
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  'vocab-crafting-machines', 'vocabulary', 'Crafting & Machines', 'Learn how to make and use the most important workstations.',
  3, 10, 35, 1,
  'CraftWords Vocabulary', '', 'original',
  108, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  'vocab-crafting-machines-lesson-0', 'vocab-crafting-machines', 0, 'vocab_drill', 'Crafting & Machines',
  ARRAY['crafting', 'enchanting', 'furnace', 'chest', 'torch', 'bucket', 'brewing', 'anvil'],
  35
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

-- Course: Action Verbs
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  'vocab-action-verbs', 'vocabulary', 'Action Verbs', 'Essential action words for your Minecraft adventure.',
  3, 8, 30, 1,
  'CraftWords Vocabulary', '', 'original',
  109, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  'vocab-action-verbs-lesson-0', 'vocab-action-verbs', 0, 'vocab_drill', 'Action Verbs',
  ARRAY['explore', 'survive', 'collect', 'destroy', 'protect', 'escape', 'attack', 'harvest'],
  30
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

-- Course: Describing Words
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  'vocab-describing-words', 'vocabulary', 'Describing Words', 'Adjectives to describe the world around you.',
  3, 10, 35, 2,
  'CraftWords Vocabulary', '', 'original',
  110, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  'vocab-describing-words-lesson-0', 'vocab-describing-words', 0, 'vocab_drill', 'Describing Words',
  ARRAY['dangerous', 'valuable', 'rare', 'peaceful', 'powerful', 'ancient', 'enormous', 'underground'],
  35
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

