-- =============================================================================
-- 15 — Seed vocabulary: 68 word entries for vocabulary courses
--
-- Uses INSERT ... ON CONFLICT DO UPDATE so existing entries (from earlier
-- migrations) are updated with the latest data while new entries are created.
-- =============================================================================

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'horse', 'horse', 'noun',
  'A large animal you can ride. One of the fastest ways to travel on land.', '马',
  'I tamed a horse with golden apples and now it runs super fast!', '我用金苹果驯服了一匹马，现在它跑得超级快！',
  'mob', ARRAY['steed', 'mount'],
  'A rideable animal. Different horses have different speeds, jump heights, and health.', 'Found in plains and savannas. Tame by riding it many times. Put a saddle on it to control movement.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'rabbit', 'rabbit', 'noun',
  'A small, fast animal with long ears that hops around.', '兔子',
  'The rabbit hopped away before I could catch it.', '兔子在我抓到它之前就跳走了。',
  'mob', ARRAY['bunny', 'hare'],
  'A small passive mob. It runs away from players and drops rabbit hide and raw rabbit.', 'Rabbits spawn in deserts, flower forests, and snowy biomes. They are very fast and hard to catch.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'ocelot', 'ocelot', 'noun',
  'A wild cat with spotted fur that lives in jungles.', '豹猫',
  'I saw an ocelot hunting a rabbit near the jungle.', '我看到一只豹猫在丛林附近追猎兔子。',
  'mob', ARRAY['wild cat', 'jungle cat'],
  'A shy jungle animal. Creepers are scared of ocelots and will run away from them!', 'Found only in jungle biomes. Gain its trust by slowly approaching with raw cod or salmon.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'dolphin', 'dolphin', 'noun',
  'A smart sea animal that swims fast and plays in the water.', '海豚',
  'The dolphin led me to a sunken treasure chest!', '海豚带我找到了一个沉没的宝箱！',
  'mob', ARRAY['porpoise', 'sea mammal'],
  'A friendly ocean mob. When you swim near dolphins, you get a speed boost called Dolphin''s Grace.', 'Dolphins spawn in ocean biomes. Feed them raw cod and they lead you to buried treasure or shipwrecks.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'turtle', 'turtle', 'noun',
  'A slow animal with a hard shell that lives near beaches.', '海龟',
  'Baby turtles are so tiny when they first hatch on the beach.', '小海龟刚在沙滩上孵化时非常非常小。',
  'mob', ARRAY['tortoise', 'sea turtle'],
  'A peaceful beach mob. Baby turtles drop scute when they grow up, used to craft a turtle helmet.', 'Found on beaches. Breed with seagrass. Baby turtles remember their home beach and always return there.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'pickaxe', 'pickaxe', 'noun',
  'A pointed tool used for breaking rocks and mining ores.', '镐',
  'You need an iron pickaxe to mine gold ore.', '你需要铁镐才能挖金矿石。',
  'sword', ARRAY['pick', 'mining tool'],
  'The most important mining tool. Different materials mine faster. Diamond pickaxe can mine obsidian.', 'Craft with 3 material blocks + 2 sticks in a T-shape on the crafting table.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'sword', 'sword', 'noun',
  'A long, sharp weapon used for fighting.', '剑',
  'I used my diamond sword to fight the Ender Dragon.', '我用钻石剑和末影龙战斗。',
  'sword', ARRAY['blade', 'weapon'],
  'The main weapon for fighting mobs. Can be enchanted with Sharpness, Smite, or Fire Aspect.', 'Craft with 1 stick + 2 material blocks (wood/stone/iron/gold/diamond/netherite) vertically.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'shovel', 'shovel', 'noun',
  'A tool with a flat blade used for digging soil and sand.', '铲子',
  'Use a shovel to dig sand for making glass.', '用铲子挖沙子来制造玻璃。',
  'sword', ARRAY['spade', 'digger'],
  'The fastest tool for digging dirt, sand, gravel, and snow. Also makes grass paths.', 'Craft with 1 stick + 1 material block vertically on the crafting table.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'axe', 'axe', 'noun',
  'A tool with a heavy blade used for chopping wood.', '斧头',
  'An axe chops wood much faster than using your hands.', '斧头砍树比用手快得多。',
  'sword', ARRAY['hatchet', 'chopper'],
  'Chops wood fast and deals high damage in combat. Can strip logs into stripped logs.', 'Craft with 2 sticks + 3 material blocks in an L-shape on the crafting table.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'bow', 'bow', 'noun',
  'A curved weapon that shoots arrows at enemies from far away.', '弓',
  'I shot the skeleton from far away with my bow.', '我用弓从远处射击骷髅。',
  'sword', ARRAY['longbow', 'ranged weapon'],
  'A ranged weapon. Hold right-click to charge for more damage. Great for fighting from a safe distance.', 'Craft with 3 sticks + 3 strings. Skeletons also drop bows sometimes when killed.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'arrow', 'arrow', 'noun',
  'A thin, pointed stick shot from a bow.', '箭',
  'I need more arrows before going to fight the wither.', '去打凋灵之前我需要更多的箭。',
  'sword', ARRAY['bolt', 'projectile'],
  'Ammunition for bows and crossbows. Tipped arrows can apply potion effects to targets.', 'Craft with 1 flint + 1 stick + 1 feather. Also dropped by skeletons.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'shield', 'shield', 'noun',
  'A flat piece of armor held in front of you to block attacks.', '盾牌',
  'My shield blocked the skeleton''s arrow just in time!', '我的盾牌刚好挡住了骷髅射来的箭！',
  'sword', ARRAY['guard', 'protector'],
  'Blocks most attacks when held. Can block creeper explosions and arrow damage.', 'Craft with 6 planks + 1 iron ingot. You can add a banner to customize its look.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'armor', 'armor', 'noun',
  'Protective clothing worn to reduce damage from attacks.', '盔甲',
  'Diamond armor protects you much better than iron armor.', '钻石盔甲比铁盔甲的保护效果好得多。',
  'sword', ARRAY['protection', 'gear'],
  'A set of 4 pieces: helmet, chestplate, leggings, boots. Reduces damage from mobs and falls.', 'Craft each piece from leather, iron, gold, diamond, or netherite. Better material = more protection.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'diamond', 'diamond', 'noun',
  'A very hard, shiny precious stone. One of the rarest materials.', '钻石',
  'I finally found diamonds deep underground after hours of mining!', '经过数小时的挖掘，我终于在地底深处找到了钻石！',
  'enchant', ARRAY['gem', 'jewel'],
  'One of the best materials for tools and armor. Second only to netherite.', 'Found at Y-level -64 to 16. Mine with an iron pickaxe or better. Most common around Y=-59.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'emerald', 'emerald', 'noun',
  'A bright green precious stone used as money in villages.', '绿宝石',
  'I traded emeralds with the villager for enchanted books.', '我用绿宝石和村民交易换了附魔书。',
  'enchant', ARRAY['green gem', 'jewel'],
  'The currency for trading with villagers. Different villagers sell different items.', 'Trade with villagers, mine emerald ore in mountains, or find in treasure chests.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'gold', 'gold', 'noun',
  'A soft, yellow, shiny metal that is very valuable.', '金',
  'Gold tools are fast but break very quickly.', '金工具速度快但非常容易坏。',
  'enchant', ARRAY['golden', 'Au'],
  'Used for golden apples, powered rails, and trading with piglins in the Nether.', 'Mine gold ore underground or in the Nether (nether gold ore). Smelt in a furnace.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'coal', 'coal', 'noun',
  'A black rock that burns well. Used as fuel.', '煤炭',
  'I use coal to make torches and cook food in the furnace.', '我用煤炭制作火把和在熔炉里烧食物。',
  'blocks', ARRAY['charcoal', 'fuel'],
  'The most common fuel source. One coal smelts 8 items. Also used to craft torches.', 'Mine coal ore with any pickaxe. Found at most heights. Very common in mountains.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'redstone', 'redstone', 'noun',
  'A red powder used to build machines and circuits in Minecraft.', '红石',
  'I built an automatic door using redstone.', '我用红石做了一扇自动门。',
  'enchant', ARRAY['circuit dust', 'power'],
  'Minecraft''s electricity. Used to build machines, traps, automatic farms, and secret doors.', 'Mine redstone ore deep underground with an iron pickaxe. One ore drops 4-5 redstone dust.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'netherite', 'netherite', 'noun',
  'The strongest and rarest material in Minecraft. Fireproof and powerful.', '下界合金',
  'Netherite tools never burn in lava, which is amazing!', '下界合金工具永远不会在岩浆中烧毁，太厉害了！',
  'enchant', ARRAY['ancient debris', 'ultimate material'],
  'The best material in the game. Netherite items float in lava and have the highest durability.', 'Find ancient debris in the Nether at Y=15. Smelt into netherite scrap, combine 4 scraps + 4 gold ingots.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'ore', 'ore', 'noun',
  'A type of rock that contains valuable metals or minerals.', '矿石',
  'Different ores are found at different depths underground.', '不同的矿石在地下不同深度被发现。',
  'blocks', ARRAY['mineral', 'deposit'],
  'Raw blocks containing metals (iron, gold, copper, diamond, etc.) that you mine to get materials.', 'Found underground at various Y-levels. Each ore type requires a specific pickaxe tier to mine.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'bread', 'bread', 'noun',
  'A common food made from wheat flour.', '面包',
  'Bread is easy to make and fills your hunger bar well.', '面包容易制作，还能很好地填饱肚子。',
  'blocks', ARRAY['loaf', 'baked food'],
  'A simple food that restores 5 hunger points. One of the easiest foods to mass-produce.', 'Craft from 3 wheat placed in a row. Wheat grows from seeds on farmland near water.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'apple', 'apple', 'noun',
  'A round, red or green fruit that grows on trees.', '苹果',
  'An apple fell from the tree when I chopped it down.', '我砍树的时候掉下来一个苹果。',
  'blocks', ARRAY['fruit', 'red fruit'],
  'A basic food item. Golden apples give special abilities like Absorption and Regeneration.', 'Small chance to drop when breaking oak or dark oak leaves. Also found in chests.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'steak', 'steak', 'noun',
  'A thick piece of cooked beef. Very filling.', '牛排',
  'Cooked steak is one of the best foods in the game!', '熟牛排是游戏中最好的食物之一！',
  'blocks', ARRAY['beef', 'cooked meat'],
  'One of the best foods. Restores 8 hunger points and 12.8 saturation — keeps you full longer.', 'Kill a cow for raw beef, then cook it in a furnace, smoker, or campfire.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'salmon', 'salmon', 'noun',
  'A large fish with pink flesh that swims upstream.', '三文鱼',
  'I caught three salmon while fishing by the river.', '我在河边钓鱼时钓到了三条三文鱼。',
  'mob', ARRAY['fish', 'pink fish'],
  'A fish you can eat or use to tame cats and make dolphins follow you.', 'Catch with a fishing rod, kill salmon mobs in rivers/oceans, or find in village chests.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'cake', 'cake', 'noun',
  'A sweet dessert food, often for celebrations.', '蛋糕',
  'I placed a cake on the table for my friend''s birthday party.', '我在桌上放了一个蛋糕庆祝朋友的生日。',
  'blocks', ARRAY['dessert', 'pastry'],
  'A special food block you place down. It has 7 slices — each player can eat one slice at a time.', 'Craft with 3 milk buckets + 2 sugar + 3 wheat + 1 egg. A complex but fun recipe!'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'mushroom', 'mushroom', 'noun',
  'A small plant-like living thing that grows in dark, damp places.', '蘑菇',
  'I found red and brown mushrooms growing inside the dark cave.', '我在黑暗的洞穴里发现了红色和棕色的蘑菇。',
  'blocks', ARRAY['fungus', 'toadstool'],
  'Used to make mushroom stew (a good food). Huge mushrooms can be found in dark forests and mushroom islands.', 'Found in dark areas, caves, and swamps. Craft mushroom stew with 1 red + 1 brown mushroom + 1 bowl.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'wheat', 'wheat', 'noun',
  'A golden grain crop used to make bread and other foods.', '小麦',
  'I grew a whole field of wheat near my house.', '我在房子旁边种了一整片小麦。',
  'blocks', ARRAY['grain', 'crop'],
  'The most basic crop. Used to make bread and to breed cows and sheep.', 'Plant seeds on farmland near water. Break tall grass to get seeds. Takes several minutes to grow.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'carrot', 'carrot', 'noun',
  'An orange root vegetable that grows underground.', '胡萝卜',
  'Pigs follow you if you hold a carrot!', '如果你拿着胡萝卜，猪会跟着你走！',
  'blocks', ARRAY['root', 'veggie'],
  'A food and breeding item. Used to lure and breed pigs. Golden carrots are great food.', 'Found in village farms or dropped by zombies rarely. Plant on farmland to grow more.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'potato', 'potato', 'noun',
  'A round, starchy vegetable that grows underground.', '土豆',
  'Baked potatoes taste much better than raw ones.', '烤土豆比生土豆好吃多了。',
  'blocks', ARRAY['spud', 'tuber'],
  'A crop that can be eaten raw or baked in a furnace for more hunger restoration.', 'Found in village farms or dropped by zombies. Plant on farmland. Sometimes a poisonous potato drops.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'cave', 'cave', 'noun',
  'A natural underground hole or tunnel in rock.', '洞穴',
  'We explored a huge cave full of bats and ores.', '我们探索了一个巨大的洞穴，里面有蝙蝠和矿石。',
  'blocks', ARRAY['cavern', 'grotto'],
  'Underground areas full of ores, mobs, and adventure. New lush caves have beautiful plants.', 'Found naturally underground. Bring torches, food, and weapons before exploring!'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'ocean', 'ocean', 'noun',
  'A very large body of salt water covering much of the earth.', '海洋',
  'I sailed across the ocean in my boat to find a new island.', '我乘船穿越大海去寻找新的岛屿。',
  'blocks', ARRAY['sea', 'deep water'],
  'A large biome with ocean monuments, shipwrecks, buried treasure, and coral reefs.', 'Explore by boat or swimming. Use a potion of water breathing to explore underwater ruins.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'forest', 'forest', 'noun',
  'A large area covered with many trees.', '森林',
  'The forest is the best place to get wood for building.', '森林是获取建筑用木材的最佳地点。',
  'blocks', ARRAY['woods', 'woodland'],
  'A common biome with lots of trees. Great for collecting wood early in the game.', 'One of the most common biomes. Variants include birch forest, dark forest, and flower forest.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'desert', 'desert', 'noun',
  'A very dry, sandy area with little rain and few plants.', '沙漠',
  'The desert is hot during the day but cold at night.', '沙漠白天很热但晚上很冷。',
  'blocks', ARRAY['wasteland', 'dunes'],
  'A sandy biome with desert temples, villages, and cacti. No rain falls in deserts.', 'Found as a biome. Contains sand, sandstone, dead bushes, and desert wells.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'jungle', 'jungle', 'noun',
  'A thick, tropical forest with very tall trees and many plants.', '丛林',
  'Ocelots and parrots live in the jungle.', '豹猫和鹦鹉住在丛林里。',
  'blocks', ARRAY['rainforest', 'tropical forest'],
  'A rare biome with very tall trees, cocoa beans, bamboo, and jungle temples with puzzles.', 'A rare biome to find. Contains unique animals like ocelots, parrots, and pandas.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'river', 'river', 'noun',
  'A long natural flow of water across the land.', '河流',
  'I built my house next to a river for easy water access.', '我在河边建了房子，方便取水。',
  'blocks', ARRAY['stream', 'waterway'],
  'A thin water biome between other biomes. Salmon and squid spawn in rivers.', 'Rivers generate naturally between biomes. Good source of clay and sand.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'mountain', 'mountain', 'noun',
  'A very high, rocky area of land that rises above the ground.', '山',
  'I climbed to the top of the mountain to see the whole world.', '我爬到山顶俯瞰整个世界。',
  'blocks', ARRAY['peak', 'summit'],
  'Tall biome with goats, snow, and emerald ore. The higher you go, the more snow you see.', 'Found naturally. Mountains can generate above Y=200. Emerald ore only spawns in mountain biomes.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'biome', 'biome', 'noun',
  'A large area with its own climate, plants, and animals.', '生物群系',
  'Each biome has different trees, animals, and weather.', '每个生物群系有不同的树木、动物和天气。',
  'blocks', ARRAY['region', 'zone'],
  'The world is divided into biomes like forests, deserts, oceans, and tundra, each with unique features.', 'Generated when the world is created. Use the F3 debug screen to see which biome you are in.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'nether', 'nether', 'noun',
  'A dark, fiery underground dimension full of lava and danger.', '下界',
  'The Nether is extremely dangerous but has valuable resources.', '下界非常危险但有珍贵的资源。',
  'enchant', ARRAY['underworld', 'hell dimension'],
  'A separate dimension accessed through a portal. Contains blaze rods, nether wart, and ancient debris.', 'Build a nether portal frame with obsidian (4×5) and light it with flint and steel.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'portal', 'portal', 'noun',
  'A magical doorway that takes you to another place.', '传送门',
  'I stepped through the portal and appeared in the Nether!', '我走进传送门就出现在了下界！',
  'enchant', ARRAY['gateway', 'doorway'],
  'Two types: Nether Portal (obsidian frame + fire) and End Portal (end portal frames + eyes of ender).', 'Nether portal: 10+ obsidian in a 4×5 frame. End portal: found in strongholds, fill with eyes of ender.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'blaze', 'blaze', 'noun',
  'A floating, fire-shooting mob found in the Nether.', '烈焰人',
  'Blazes guard the Nether fortress and shoot fireballs at you.', '烈焰人守卫着下界要塞并向你发射火球。',
  'mob', ARRAY['fire elemental', 'flame mob'],
  'A dangerous Nether mob that floats and shoots 3 fireballs. Drops blaze rods for brewing stands.', 'Found only in Nether fortresses. Kill them to get blaze rods (essential for beating the game).'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'fortress', 'fortress', 'noun',
  'A large, strong building or castle built for defense.', '要塞',
  'We found a huge fortress in the Nether full of dangerous mobs.', '我们在下界发现了一座巨大的要塞，里面满是危险的怪物。',
  'blocks', ARRAY['castle', 'stronghold'],
  'A dark structure in the Nether. Contains blazes, wither skeletons, and nether wart for potions.', 'Generated in the Nether. Explore carefully — blazes and wither skeletons spawn here.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'potion', 'potion', 'noun',
  'A magical liquid that gives you special powers when you drink it.', '药水',
  'I drank a potion of strength before fighting the boss.', '我在打Boss之前喝了一瓶力量药水。',
  'enchant', ARRAY['elixir', 'brew'],
  'Gives temporary effects like speed, strength, healing, invisibility, or water breathing.', 'Brew at a brewing stand using blaze powder, water bottles, and nether wart plus other ingredients.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'stronghold', 'stronghold', 'noun',
  'A hidden underground structure that contains the End Portal.', '据点',
  'We followed the eyes of ender to find the stronghold.', '我们跟着末影之眼找到了据点。',
  'blocks', ARRAY['fortress', 'hidden base'],
  'A rare underground structure with the End Portal. You must find it to reach The End dimension.', 'Throw eyes of ender into the sky — they fly toward the nearest stronghold. Dig down when they drop.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'dragon', 'dragon', 'noun',
  'A huge, powerful flying creature that breathes fire.', '龙',
  'The Ender Dragon is the final boss of Minecraft!', '末影龙是Minecraft的最终Boss！',
  'mob', ARRAY['ender dragon', 'boss'],
  'The final boss. It flies around The End, shoots acid, and knocks you into the void.', 'Found in The End dimension. Destroy the end crystals first, then attack with a bow and sword.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'crafting', 'crafting', 'noun',
  'The process of making something by combining materials.', '合成',
  'Crafting is the most important skill in Minecraft.', '合成是Minecraft中最重要的技能。',
  'blocks', ARRAY['making', 'building'],
  'The core mechanic. Place items in a 3×3 grid on a crafting table to make tools, blocks, and items.', 'Use a crafting table (made from 4 planks). Your inventory has a small 2×2 crafting grid too.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'enchanting', 'enchanting', 'noun',
  'Adding magical powers to tools, weapons, or armor.', '附魔',
  'Enchanting my sword made it much more powerful!', '给我的剑附魔让它变得更加强大！',
  'enchant', ARRAY['magic upgrade', 'empowering'],
  'Adds special powers like Sharpness, Protection, Fortune, or Unbreaking to your gear.', 'Use an enchanting table + lapis lazuli + XP levels. Surround with bookshelves for better enchantments.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'furnace', 'furnace', 'noun',
  'A device used to heat things up, like cooking food or melting metals.', '熔炉',
  'I put the iron ore in the furnace to make iron ingots.', '我把铁矿石放进熔炉炼成铁锭。',
  'blocks', ARRAY['oven', 'smelter'],
  'Used to smelt ores into ingots and cook raw food. One of the first things you should build.', 'Craft with 8 cobblestone blocks in a square (leave center empty). Uses coal or wood as fuel.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'chest', 'chest', 'noun',
  'A large box used to store items and belongings.', '箱子',
  'I put all my diamonds in a chest to keep them safe.', '我把所有钻石放进箱子里保存起来。',
  'blocks', ARRAY['box', 'container'],
  'Stores 27 stacks of items. Place two chests side by side for a double chest (54 slots).', 'Craft with 8 planks in a square. Also found in dungeons, temples, shipwrecks, and villages.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'torch', 'torch', 'noun',
  'A stick that burns at one end to give light.', '火把',
  'Always carry torches when you go into dark caves.', '进入黑暗的洞穴时一定要带上火把。',
  'blocks', ARRAY['light', 'flame stick'],
  'Provides light level 14. Prevents mobs from spawning nearby. Your best friend underground.', 'Craft with 1 coal/charcoal on top of 1 stick. Makes 4 torches. Soul torches use soul sand.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'bucket', 'bucket', 'noun',
  'A container used to carry water, lava, or milk.', '桶',
  'I used a water bucket to save myself from a long fall!', '我用水桶救了自己一命，避免了高处坠落！',
  'blocks', ARRAY['pail', 'container'],
  'Carries water, lava, milk, or fish. Water bucket saves you from fall damage (MLG water bucket trick!).', 'Craft with 3 iron ingots in a V-shape. Right-click water/lava to pick it up.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'brewing', 'brewing', 'noun',
  'The process of making potions by mixing ingredients.', '酿造',
  'Brewing potions requires nether wart and blaze powder.', '酿造药水需要地狱疣和烈焰粉。',
  'enchant', ARRAY['potion-making', 'mixing'],
  'Creates potions at a brewing stand. Base: water bottle + nether wart = awkward potion, then add ingredients.', 'Need a brewing stand (1 blaze rod + 3 cobblestone) and blaze powder as fuel.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'anvil', 'anvil', 'noun',
  'A heavy iron block used for shaping metal or repairing tools.', '铁砧',
  'I used the anvil to repair my enchanted sword.', '我用铁砧修复了我的附魔剑。',
  'blocks', ARRAY['smithy', 'repair block'],
  'Repairs, renames, and combines enchanted items. Uses XP levels. Falls with gravity!', 'Craft with 3 iron blocks + 4 iron ingots. Needs 31 iron ingots total — expensive but essential.'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'explore', 'explore', 'verb',
  'To travel around a new place to learn about it.', '探索',
  'Let''s explore the cave and see what treasures we can find!', '我们去探索洞穴，看看能找到什么宝藏！',
  'blocks', ARRAY['discover', 'investigate'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'survive', 'survive', 'verb',
  'To stay alive through a dangerous or difficult situation.', '生存',
  'You must survive the first night by building a shelter quickly.', '你必须通过快速建造庇护所来度过第一个夜晚。',
  'sword', ARRAY['endure', 'stay alive'],
  'Survival mode is the main way to play. You must find food, build shelter, and fight mobs.', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'collect', 'collect', 'verb',
  'To gather things together from different places.', '收集',
  'I need to collect more wood before I can build a house.', '在建房子之前我需要收集更多的木材。',
  'blocks', ARRAY['gather', 'harvest'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'destroy', 'destroy', 'verb',
  'To break something completely so it cannot be used anymore.', '破坏',
  'The creeper destroyed half of my house when it exploded!', '苦力怕爆炸时炸毁了我房子的一半！',
  'sword', ARRAY['demolish', 'wreck'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'protect', 'protect', 'verb',
  'To keep someone or something safe from harm.', '保护',
  'I built walls to protect my village from zombies.', '我建了围墙来保护村庄不受僵尸侵扰。',
  'sword', ARRAY['defend', 'guard'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'escape', 'escape', 'verb',
  'To get away from a dangerous or unpleasant situation.', '逃跑',
  'I barely escaped from the creeper before it exploded!', '我差点没在苦力怕爆炸前逃走！',
  'sword', ARRAY['flee', 'run away'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'attack', 'attack', 'verb',
  'To try to hurt someone or something by fighting.', '攻击',
  'Zombies attack you if they see you at night.', '僵尸在夜里看到你就会攻击你。',
  'sword', ARRAY['strike', 'assault'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'harvest', 'harvest', 'verb',
  'To gather crops or plants when they are ready.', '收获',
  'It''s time to harvest the wheat — it''s fully grown!', '是时候收获小麦了——它已经完全成熟了！',
  'blocks', ARRAY['reap', 'pick'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'dangerous', 'dangerous', 'adj',
  'Likely to cause harm or injury. Not safe.', '危险的',
  'The Nether is a very dangerous place full of lava.', '下界是一个到处是岩浆的非常危险的地方。',
  'sword', ARRAY['risky', 'hazardous'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'valuable', 'valuable', 'adj',
  'Worth a lot of money or very useful.', '有价值的',
  'Diamonds are the most valuable resource for tools.', '钻石是做工具最有价值的资源。',
  'enchant', ARRAY['precious', 'worthwhile'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'rare', 'rare', 'adj',
  'Very uncommon and hard to find.', '稀有的',
  'Emerald ore is very rare and only found in mountains.', '绿宝石矿石非常稀有，只在山地生物群系中出现。',
  'enchant', ARRAY['scarce', 'uncommon'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'peaceful', 'peaceful', 'adj',
  'Calm, quiet, and free from fighting or violence.', '和平的',
  'The flower forest is such a peaceful biome.', '花森林是一个如此宁静的生物群系。',
  'blocks', ARRAY['calm', 'tranquil'],
  'Peaceful difficulty means no hostile mobs spawn. Good for building and exploring safely.', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'powerful', 'powerful', 'adj',
  'Having great strength, force, or ability.', '强大的',
  'The enchanted diamond sword is very powerful!', '附魔钻石剑非常强大！',
  'enchant', ARRAY['strong', 'mighty'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'ancient', 'ancient', 'adj',
  'Very, very old. From a long time ago.', '远古的',
  'Ancient debris is the key to getting netherite.', '远古残骸是获得下界合金的关键。',
  'enchant', ARRAY['old', 'prehistoric'],
  'Ancient debris is the ore for netherite, the strongest material in the game.', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'enormous', 'enormous', 'adj',
  'Extremely large in size or amount.', '巨大的',
  'The ocean monument is enormous — it took us an hour to explore!', '海底神殿巨大无比——我们花了一个小时才探索完！',
  'blocks', ARRAY['huge', 'massive'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  'underground', 'underground', 'adj',
  'Below the surface of the ground.', '地下的',
  'Most ores are found deep underground.', '大多数矿石都在地下深处被发现。',
  'blocks', ARRAY['subterranean', 'below ground'],
  '', ''
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en,
  example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon,
  synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role,
  minecraft_obtain = EXCLUDED.minecraft_obtain;

