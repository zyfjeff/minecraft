-- =============================================================================
-- CraftWords — Vocabulary table enhancement
--
-- Adds 3 new columns to public.vocab:
--   1. synonyms         text[]  — related/similar words
--   2. minecraft_role    text    — what this thing does in Minecraft (simple English)
--   3. minecraft_obtain  text    — how to get or craft it (simple English)
--
-- Run in Supabase SQL Editor AFTER supabase-courses-schema.sql.
-- Idempotent: safe to re-run.
-- =============================================================================

-- Add columns (IF NOT EXISTS not supported for ADD COLUMN in all PG versions,
-- so we use a DO block for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocab' AND column_name = 'synonyms')
  THEN
    ALTER TABLE public.vocab ADD COLUMN synonyms text[] NOT NULL DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocab' AND column_name = 'minecraft_role')
  THEN
    ALTER TABLE public.vocab ADD COLUMN minecraft_role text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocab' AND column_name = 'minecraft_obtain')
  THEN
    ALTER TABLE public.vocab ADD COLUMN minecraft_obtain text NOT NULL DEFAULT '';
  END IF;
END $$;

-- =============================================================================
-- Populate the new fields for existing mob vocabulary
-- =============================================================================

UPDATE public.vocab SET
  synonyms = ARRAY['monster', 'exploder'],
  minecraft_role = 'A dangerous enemy. It walks toward you quietly and then explodes, destroying blocks nearby.',
  minecraft_obtain = 'You cannot tame or keep a creeper. They spawn at night in dark areas.'
WHERE id = 'creeper';

UPDATE public.vocab SET
  synonyms = ARRAY['undead', 'walker'],
  minecraft_role = 'A common enemy at night. It moves slowly and hits you with its arms.',
  minecraft_obtain = 'Zombies spawn in the dark. You cannot craft them. Kill them for rotten flesh.'
WHERE id = 'zombie';

UPDATE public.vocab SET
  synonyms = ARRAY['bones', 'archer'],
  minecraft_role = 'A ranged enemy that shoots arrows at you from far away. Very dangerous in open areas.',
  minecraft_obtain = 'Skeletons spawn at night. Kill them to get bones and arrows.'
WHERE id = 'skeleton';

UPDATE public.vocab SET
  synonyms = ARRAY['bug', 'crawler'],
  minecraft_role = 'An enemy that can climb walls. Neutral in daylight but hostile at night.',
  minecraft_obtain = 'Spiders spawn in the dark. Kill them to get string and spider eyes.'
WHERE id = 'spider';

UPDATE public.vocab SET
  synonyms = ARRAY['ender', 'teleporter'],
  minecraft_role = 'A tall, dark creature that teleports. It becomes angry if you look at its eyes.',
  minecraft_obtain = 'Endermen spawn in all dimensions. Kill them to get ender pearls for the End portal.'
WHERE id = 'enderman';

UPDATE public.vocab SET
  synonyms = ARRAY['hog', 'piggy'],
  minecraft_role = 'A friendly animal that gives you food. It follows you if you hold a carrot.',
  minecraft_obtain = 'Pigs spawn on grass in daylight. Breed them with carrots. They drop pork chops.'
WHERE id = 'pig';

UPDATE public.vocab SET
  synonyms = ARRAY['cattle', 'bovine'],
  minecraft_role = 'A friendly animal that gives milk and leather. Right-click with a bucket for milk.',
  minecraft_obtain = 'Cows spawn on grass. Breed them with wheat. They drop leather and raw beef.'
WHERE id = 'cow';

UPDATE public.vocab SET
  synonyms = ARRAY['lamb', 'ewe'],
  minecraft_role = 'A friendly animal that grows wool. Use shears to collect wool without killing it.',
  minecraft_obtain = 'Sheep spawn on grass. Breed with wheat. Shear them or they drop wool when killed.'
WHERE id = 'sheep';

UPDATE public.vocab SET
  synonyms = ARRAY['hen', 'poultry'],
  minecraft_role = 'A small animal that lays eggs. Eggs can hatch into baby chickens when thrown.',
  minecraft_obtain = 'Chickens spawn on grass. Breed with seeds. They drop feathers and raw chicken.'
WHERE id = 'chicken';

UPDATE public.vocab SET
  synonyms = ARRAY['dog', 'hound'],
  minecraft_role = 'A wild animal you can tame. Once tamed, it follows you and fights enemies for you.',
  minecraft_obtain = 'Wolves spawn in forests. Tame with bones. Feed meat to heal. They wear a collar.'
WHERE id = 'wolf';

UPDATE public.vocab SET
  synonyms = ARRAY['honeybee', 'pollinator'],
  minecraft_role = 'A tiny flying creature that carries pollen between flowers. Makes honey in beehives.',
  minecraft_obtain = 'Bees live near flowers and hives. Use shears on a full hive for honeycomb. Use campfire smoke to calm them.'
WHERE id = 'bee';

UPDATE public.vocab SET
  synonyms = ARRAY['phantom', 'fireball-shooter'],
  minecraft_role = 'A huge flying enemy in the Nether. It shoots explosive fireballs at you from far away.',
  minecraft_obtain = 'Ghasts spawn in the Nether. Kill them to get ghast tears (used in potions).'
WHERE id = 'ghast';

-- =============================================================================
-- Populate the new fields for building materials vocabulary
-- =============================================================================

UPDATE public.vocab SET
  synonyms = ARRAY['rock', 'mineral'],
  minecraft_role = 'The most common building block underground. Smooth and grey. Good for floors and walls.',
  minecraft_obtain = 'Mine stone with a pickaxe. It drops cobblestone. Smelt cobblestone in a furnace to get smooth stone.'
WHERE id = 'stone';

UPDATE public.vocab SET
  synonyms = ARRAY['cobble', 'rough stone'],
  minecraft_role = 'A rough version of stone. Very common and easy to get. Good for quick shelters.',
  minecraft_obtain = 'Mine any stone block with a pickaxe. It drops cobblestone automatically.'
WHERE id = 'cobblestone';

UPDATE public.vocab SET
  synonyms = ARRAY['clay block', 'red block'],
  minecraft_role = 'A strong red building block. Looks great for houses, chimneys, and paths.',
  minecraft_obtain = 'Find clay balls underwater. Smelt them into bricks. Combine 4 bricks into a brick block.'
WHERE id = 'brick';

UPDATE public.vocab SET
  synonyms = ARRAY['log', 'timber'],
  minecraft_role = 'The first material you get. Used to craft planks, sticks, and many tools.',
  minecraft_obtain = 'Punch or chop any tree trunk. Different trees give different wood colors.'
WHERE id = 'wood';

UPDATE public.vocab SET
  synonyms = ARRAY['board', 'lumber'],
  minecraft_role = 'A flat wooden block. The base material for crafting tables, sticks, and wooden tools.',
  minecraft_obtain = 'Put one wood log in the crafting grid. You get 4 planks from 1 log.'
WHERE id = 'plank';

UPDATE public.vocab SET
  synonyms = ARRAY['window', 'transparent block'],
  minecraft_role = 'A see-through block for windows. Light passes through but mobs cannot see you.',
  minecraft_obtain = 'Smelt sand in a furnace to make glass. Cannot be picked up once placed (unless using Silk Touch).'
WHERE id = 'glass';

UPDATE public.vocab SET
  synonyms = ARRAY['dark stone', 'portal block'],
  minecraft_role = 'The hardest block to mine. Needed to build Nether portals. Blast-proof.',
  minecraft_obtain = 'Pour water on lava source blocks. Mine with a diamond or netherite pickaxe (takes 10 seconds).'
WHERE id = 'obsidian';

UPDATE public.vocab SET
  synonyms = ARRAY['desert stone', 'sand brick'],
  minecraft_role = 'A yellow building block found in deserts. Smooth and warm-looking. Great for desert builds.',
  minecraft_obtain = 'Found naturally in desert biomes. Or craft from 4 sand blocks in a 2x2 pattern.'
WHERE id = 'sandstone';

UPDATE public.vocab SET
  synonyms = ARRAY['nether quartz', 'white stone'],
  minecraft_role = 'A white decorative block from the Nether. Very elegant for pillars and modern builds.',
  minecraft_obtain = 'Mine nether quartz ore in the Nether. Craft into quartz blocks (4 quartz = 1 block).'
WHERE id = 'quartz';

UPDATE public.vocab SET
  synonyms = ARRAY['metal', 'Fe'],
  minecraft_role = 'A strong metal for tools and armor. Better than stone but weaker than diamond.',
  minecraft_obtain = 'Mine iron ore underground (any level). Smelt in a furnace to get iron ingots.'
WHERE id = 'iron';

-- =============================================================================
-- Done. All 22 vocab entries now have synonyms, minecraft_role, and minecraft_obtain.
-- =============================================================================
