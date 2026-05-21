-- =============================================================================
-- Vocabulary entries from import-youtube-course skill
-- Generated at: 2026-05-21T11:29:54.032Z
-- Uses INSERT ... ON CONFLICT DO UPDATE for idempotency
-- =============================================================================

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'explore', 'explore', 'verb',
  'To travel through an unknown area to learn about it and find new things.', '探索',
  'I decided to explore the deep cave system to find rare ores.', '我决定探索深层洞穴系统来寻找稀有矿石。',
  'blocks', ARRAY['discover', 'investigate'],
  'Exploring is the heart of Minecraft. You explore caves, oceans, biomes, and structures to gather resources and discover secrets.', 'Walk into unexplored territory. Use maps and compasses to track your path and find new biomes.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'search', 'search', 'verb',
  'To look carefully through a place to try to find something specific.', '搜索',
  'I searched the abandoned mineshaft for valuable treasures.', '我搜索了废弃矿井寻找珍贵宝物。',
  'blocks', ARRAY['hunt', 'seek'],
  'Searching is essential when looking for specific resources like diamonds, strongholds, or rare structures.', 'Search underwater temples for sponges, or search villages for emerald trades with villagers.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'survive', 'survive', 'verb',
  'To continue to live, especially after facing danger or difficult conditions.', '生存',
  'I barely survived my first night because I forgot to build a shelter.', '我差点没有活过第一个夜晚，因为忘了建庇护所。',
  'sword', ARRAY['endure', 'persist'],
  'Survival is the main game mode where you must gather resources, eat food, and defend against monsters to stay alive.', 'Keep your health and hunger bars full. Build shelter before nightfall and wear armor for protection.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'adventure', 'adventure', 'noun',
  'An exciting experience that involves risk and the unknown.', '冒险',
  'Every new Minecraft world is the beginning of a great adventure.', '每个新的Minecraft世界都是一段伟大冒险的开始。',
  'blocks', ARRAY['quest', 'expedition'],
  'Adventure is both a game mode and the spirit of Minecraft. Each world generates unique landscapes and challenges.', 'Start a new world in survival mode for the ultimate adventure experience.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'wander', 'wander', 'verb',
  'To walk around without a clear direction or purpose.', '漫游',
  'I wandered through the dark forest looking for a village.', '我在黑森林中漫游寻找村庄。',
  'blocks', ARRAY['roam', 'stroll'],
  'Wandering traders appear near your base offering rare items. Sometimes wandering leads to amazing discoveries.', 'Wandering traders spawn randomly near players every 20 minutes carrying exotic items.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'dangerous', 'dangerous', 'adj',
  'Likely to cause harm or injury; not safe.', '危险的',
  'The Nether is extremely dangerous because of lava and hostile mobs.', '下界因为岩浆和敌对生物而极度危险。',
  'sword', ARRAY['hazardous', 'perilous'],
  'Many places in Minecraft are dangerous: The Nether, ocean monuments, woodland mansions, and caves at night.', 'Prepare for danger with armor, weapons, food, and potions before exploring risky areas.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'escape', 'escape', 'verb',
  'To get away from a dangerous or unpleasant situation.', '逃脱',
  'I had to escape from a group of zombies chasing me through the forest.', '我不得不从一群在森林追赶我的僵尸中逃脱。',
  'sword', ARRAY['flee', 'retreat'],
  'Escaping is a survival skill. Sometimes running away from danger is smarter than fighting, especially without good gear.', 'Sprint and jump to move faster. Use water buckets, ender pearls, or boats to escape quickly.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'discover', 'discover', 'verb',
  'To find something for the first time, especially something surprising.', '发现',
  'I discovered a hidden stronghold deep underground near the village.', '我在村庄附近的地下深处发现了一个隐藏的要塞。',
  'blocks', ARRAY['uncover', 'reveal'],
  'Discovering new structures, biomes, and resources is one of the most exciting parts of Minecraft gameplay.', 'Use Eyes of Ender to discover strongholds. Explore new chunks to discover structures and biomes.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'build', 'build', 'verb',
  'To make something by putting pieces or materials together.', '建造',
  'I want to build a giant castle on top of the mountain.', '我想在山顶建造一座巨大的城堡。',
  'blocks', ARRAY['construct', 'assemble'],
  'Building is a core activity in Minecraft. Players build houses, farms, bridges, and amazing structures from blocks.', 'Gather materials like wood, stone, or bricks, then place blocks to build any structure you imagine.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'wall', 'wall', 'noun',
  'A vertical structure made of blocks that separates or protects an area.', '墙',
  'I built a tall wall around my base to keep the zombies out.', '我在基地周围建了一堵高墙来阻挡僵尸进入。',
  'blocks', ARRAY['barrier', 'partition'],
  'Walls protect your base from mobs. Cobblestone walls are decorative blocks that connect automatically.', 'Craft walls from cobblestone, bricks, or other stone types at a stonecutter or crafting table.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'shelter', 'shelter', 'noun',
  'A place that gives protection from bad weather or danger.', '庇护所',
  'I dug a quick shelter into the hillside before nightfall.', '我在天黑前在山坡上挖了一个简易庇护所。',
  'blocks', ARRAY['refuge', 'hideout'],
  'Building a shelter on your first night is the most important survival task. It keeps hostile mobs away.', 'Dig into a hill, build a small wooden house, or just place blocks around you before monsters spawn.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'furnace', 'furnace', 'noun',
  'A block used for heating materials to cook food or smelt ores into ingots.', '熔炉',
  'I put the iron ore into the furnace to smelt it into ingots.', '我把铁矿石放进熔炉冶炼成铁锭。',
  'blocks', ARRAY['smelter', 'kiln'],
  'The furnace is essential for cooking raw food and smelting ores. It uses fuel like coal or wood.', 'Craft a furnace using 8 cobblestone blocks arranged in a ring on the crafting table.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'anvil', 'anvil', 'noun',
  'A heavy metal block used for repairing and combining tools and enchantments.', '铁砧',
  'I used the anvil to combine two damaged swords into one strong weapon.', '我用铁砧把两把损坏的剑合并成一把强力武器。',
  'sword', ARRAY['forge', 'smithy'],
  'The anvil repairs tools, renames items, and combines enchanted books with gear. It falls if unsupported.', 'Craft an anvil from 3 iron blocks and 4 iron ingots. Place it and right-click to use.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'upgrade', 'upgrade', 'verb',
  'To improve something by replacing it with a better version.', '升级',
  'I upgraded my wooden pickaxe to an iron one for faster mining.', '我把木镐升级成铁镐来加快挖矿速度。',
  'sword', ARRAY['improve', 'enhance'],
  'Upgrading tools and armor is key to progression. Better materials mean more durability and efficiency.', 'Use a smithing table to upgrade diamond gear to netherite, the strongest material in the game.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'repair', 'repair', 'verb',
  'To fix something that is broken or damaged so it works again.', '修复',
  'I need to repair my diamond sword before the next fight.', '我需要在下次战斗前修复我的钻石剑。',
  'sword', ARRAY['fix', 'restore'],
  'Repairing tools and armor extends their life. You can repair items using an anvil or grindstone.', 'Combine two of the same item on a crafting grid, or use an anvil with raw materials.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'design', 'design', 'verb',
  'To plan and create the appearance or layout of something.', '设计',
  'I spent hours designing the perfect interior for my house.', '我花了几个小时设计房子的完美内部装修。',
  'blocks', ARRAY['plan', 'create'],
  'Designing builds is creative work in Minecraft. Players design houses, farms, redstone machines, and pixel art.', 'Use creative mode to test designs before building them in survival. Plan layouts with dirt blocks first.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'jungle', 'jungle', 'noun',
  'A dense tropical forest with tall trees, vines, and many plants.', '丛林',
  'The jungle biome is full of tall trees, parrots, and hidden temples.', '丛林生态群系充满了高大的树木、鹦鹉和隐藏的神庙。',
  'blocks', ARRAY['rainforest', 'tropics'],
  'Jungles are rare biomes with unique features: jungle temples, bamboo, cocoa beans, ocelots, and parrots.', 'Explore your world extensively. Jungles are rare but recognizable by their enormous trees and dense vegetation.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'cave', 'cave', 'noun',
  'A natural underground opening in the earth, often containing ores and minerals.', '洞穴',
  'I found diamonds at the bottom of a deep cave.', '我在深洞穴的底部找到了钻石。',
  'blocks', ARRAY['cavern', 'grotto'],
  'Caves are the main source of ores and minerals. They range from small tunnels to massive lush caves and dripstone caves.', 'Look for cave entrances on hillsides or dig down. Bring torches and weapons for exploring safely.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'underground', 'underground', 'adj',
  'Below the surface of the earth; beneath the ground level.', '地下的',
  'The underground tunnels were full of hostile mobs and valuable ores.', '地下隧道里充满了敌对生物和珍贵矿石。',
  'blocks', ARRAY['subterranean', 'below-ground'],
  'Underground exploration is essential for finding iron, gold, diamonds, and ancient debris. Y-level affects what spawns.', 'Dig straight down carefully or find cave entrances. Diamond ore appears below Y-level 16.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'surface', 'surface', 'noun',
  'The top layer of the ground; the outside part of the world.', '地表',
  'I returned to the surface after spending hours mining underground.', '在地下挖矿几个小时后，我回到了地表。',
  'blocks', ARRAY['ground', 'terrain'],
  'The surface is where you start your journey. Trees, animals, villages, and biome features are found on the surface.', 'Pillar up with blocks or follow cave exits to return to the surface from underground.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'biome', 'biome', 'noun',
  'A large area with its own climate, plants, and animals.', '生态群系',
  'Each biome has unique resources and different types of animals.', '每个生态群系都有独特的资源和不同类型的动物。',
  'blocks', ARRAY['region', 'ecosystem'],
  'Minecraft has over 60 biomes including deserts, jungles, oceans, and mushroom islands. Each has unique blocks and mobs.', 'Walk in any direction to find new biomes. Use the /locatebiome command or explore by boat.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'forest', 'forest', 'noun',
  'A large area covered with many trees growing close together.', '森林',
  'I gathered lots of wood from the dark forest near my base.', '我从基地附近的黑森林收集了很多木头。',
  'blocks', ARRAY['woodland', 'grove'],
  'Forests provide abundant wood, the most basic building material. Dark forests have mushrooms and woodland mansions.', 'Forests are common at spawn. Punch trees to collect wood logs, your first essential resource.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'mountain', 'mountain', 'noun',
  'A very high area of land with steep sides, taller than a hill.', '山',
  'I climbed the mountain and built my base at the very top.', '我爬上了山并在最顶端建造了基地。',
  'blocks', ARRAY['peak', 'summit'],
  'Mountains provide stone, emerald ore, and goats. Mountain bases offer great views and natural protection.', 'Look for jagged peaks and stony terrain. Mountains generate at high elevation with exposed stone and snow.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'desert', 'desert', 'noun',
  'A large, dry area of land with very little water and few plants.', '沙漠',
  'I found a desert temple full of TNT traps and treasure chests.', '我发现了一座充满TNT陷阱和宝箱的沙漠神殿。',
  'blocks', ARRAY['wasteland', 'dunes'],
  'Deserts have sand, cactus, dead bushes, and desert temples with hidden treasure. Husks spawn instead of zombies.', 'Deserts are common biomes. Look for flat sandy terrain with no trees. Desert temples contain loot chests.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

