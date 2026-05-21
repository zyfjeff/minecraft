-- =============================================================================
-- CraftWords — Vocabulary course seed data
--
-- Populates:
--   1. Two vocab_drill lessons for existing courses (mob-encyclopedia, building-materials)
--   2. Vocab entries for mob names and building material names
--
-- All INSERTs use ON CONFLICT ... DO UPDATE for idempotent re-runs.
-- Run AFTER supabase-courses-schema.sql and supabase-courses-seed.sql.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) Lessons — one vocab_drill per course
-- ----------------------------------------------------------------------------

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES
  ('mob-encyclopedia/vocab-01',
   'mob-encyclopedia', 0, 'vocab_drill',
   'Common Minecraft Mobs',
   ARRAY['creeper','zombie','skeleton','spider','enderman','pig','cow','sheep','chicken','wolf','bee','ghast'],
   35),

  ('building-materials/vocab-01',
   'building-materials', 0, 'vocab_drill',
   'Blocks & Building Materials',
   ARRAY['stone','cobblestone','brick','wood','plank','glass','obsidian','sandstone','quartz','iron'],
   25)

ON CONFLICT (id) DO UPDATE SET
  highlight_words = EXCLUDED.highlight_words,
  title           = EXCLUDED.title,
  xp_reward       = EXCLUDED.xp_reward;

-- ----------------------------------------------------------------------------
-- 2) Vocab entries — Mob Encyclopedia words
-- ----------------------------------------------------------------------------

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon) VALUES

  ('creeper', 'creeper', 'noun',
   'A green hostile mob that silently approaches and explodes.',
   '苦力怕；一种会悄悄靠近并爆炸的绿色敌对生物。',
   'The creeper blew up my house while I was mining.',
   '我挖矿的时候苦力怕炸毁了我的房子。',
   'mob'),

  ('zombie', 'zombie', 'noun',
   'An undead mob that spawns at night and attacks players.',
   '僵尸；夜晚生成并攻击玩家的亡灵生物。',
   'A zombie broke down my wooden door last night.',
   '昨晚一只僵尸撞坏了我的木门。',
   'mob'),

  ('skeleton', 'skeleton', 'noun',
   'An undead mob that shoots arrows at players from a distance.',
   '骷髅；从远处向玩家射箭的亡灵生物。',
   'The skeleton shot me with an arrow from the cave entrance.',
   '骷髅从洞口朝我射了一箭。',
   'mob'),

  ('spider', 'spider', 'noun',
   'A mob that can climb walls and becomes hostile in darkness.',
   '蜘蛛；能爬墙、在黑暗中变得敌对的生物。',
   'Spiders can climb over my fence at night.',
   '蜘蛛晚上可以翻过我的栅栏。',
   'mob'),

  ('enderman', 'enderman', 'noun',
   'A tall, dark mob that teleports and becomes hostile when you look at it.',
   '末影人；一种高大漆黑、会瞬移、被注视时会敌对的生物。',
   'Do not look at the enderman or it will attack you.',
   '不要盯着末影人看，否则它会攻击你。',
   'mob'),

  ('pig', 'pig', 'noun',
   'A passive pink mob that drops pork chops when defeated.',
   '猪；一种被击败后掉落猪排的粉色被动生物。',
   'I found a group of pigs near the river.',
   '我在河边发现了一群猪。',
   'mob'),

  ('cow', 'cow', 'noun',
   'A passive mob that provides milk and leather.',
   '牛；能提供牛奶和皮革的被动生物。',
   'You can milk a cow with an empty bucket.',
   '你可以用空桶给牛挤奶。',
   'mob'),

  ('sheep', 'sheep', 'noun',
   'A passive mob that provides wool when sheared.',
   '羊；剪毛后可提供羊毛的被动生物。',
   'I sheared the sheep to get white wool for my bed.',
   '我给羊剪毛来获取做床用的白色羊毛。',
   'mob'),

  ('chicken', 'chicken', 'noun',
   'A small passive mob that lays eggs and drops feathers.',
   '鸡；会下蛋和掉落羽毛的小型被动生物。',
   'The chicken laid an egg near my farm.',
   '鸡在我的农场附近下了一个蛋。',
   'mob'),

  ('wolf', 'wolf', 'noun',
   'A neutral mob that can be tamed with bones to become a loyal pet.',
   '狼；可以用骨头驯服成为忠诚宠物的中立生物。',
   'I tamed a wolf with three bones and now it follows me.',
   '我用三根骨头驯服了一只狼，现在它跟着我。',
   'mob'),

  ('bee', 'bee', 'noun',
   'A small flying mob that pollinates flowers and produces honey.',
   '蜜蜂；为花朵授粉并产蜜的小型飞行生物。',
   'Bees fly between flowers and their hive to make honey.',
   '蜜蜂在花朵和蜂巢之间飞来飞去酿蜜。',
   'mob'),

  ('ghast', 'ghast', 'noun',
   'A large white flying mob in the Nether that shoots fireballs.',
   '恶魂；下界中会发射火球的白色大型飞行生物。',
   'The ghast shot a fireball at me while I crossed the lava lake.',
   '当我穿越岩浆湖时恶魂朝我发射了一颗火球。',
   'mob')

ON CONFLICT (id) DO UPDATE SET
  word          = EXCLUDED.word,
  pos           = EXCLUDED.pos,
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en    = EXCLUDED.example_en,
  example_zh    = EXCLUDED.example_zh,
  pixel_icon    = EXCLUDED.pixel_icon;

-- ----------------------------------------------------------------------------
-- 3) Vocab entries — Building Materials words
-- ----------------------------------------------------------------------------

INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon) VALUES

  ('stone', 'stone', 'noun',
   'A basic grey block found underground, used for building and tools.',
   '石头；地下发现的基础灰色方块，用于建造和制作工具。',
   'I mined some stone to build a wall around my base.',
   '我挖了一些石头来给我的基地建围墙。',
   'blocks'),

  ('cobblestone', 'cobblestone', 'noun',
   'A rough stone block obtained by mining stone with a pickaxe.',
   '圆石；用镐挖掘石头获得的粗糙石块。',
   'Cobblestone is great for building a quick shelter.',
   '圆石很适合快速搭建庇护所。',
   'blocks'),

  ('brick', 'brick', 'noun',
   'A building block made by smelting clay balls in a furnace.',
   '砖块；将粘土球在熔炉中烧制而成的建筑方块。',
   'I used bricks to build a chimney for my house.',
   '我用砖块给我的房子建了一个烟囱。',
   'blocks'),

  ('wood', 'wood', 'noun',
   'A natural block obtained from tree trunks.',
   '木头；从树干上获取的天然方块。',
   'You need wood to craft your first tools.',
   '你需要木头来制作你的第一批工具。',
   'blocks'),

  ('plank', 'plank', 'noun',
   'A flat wooden block crafted from wood logs.',
   '木板；由原木合成的扁平木质方块。',
   'Four planks can be crafted from one wood log.',
   '一个原木可以合成四块木板。',
   'blocks'),

  ('glass', 'glass', 'noun',
   'A transparent block made by smelting sand.',
   '玻璃；将沙子在熔炉中烧制而成的透明方块。',
   'I put glass windows in my house so I can see outside.',
   '我在房子里装了玻璃窗，这样就能看到外面。',
   'blocks'),

  ('obsidian', 'obsidian', 'noun',
   'A very hard dark purple block formed when water meets lava.',
   '黑曜石；水遇到岩浆时形成的非常坚硬的深紫色方块。',
   'You need obsidian to build a Nether portal.',
   '你需要黑曜石来建造下界传送门。',
   'blocks'),

  ('sandstone', 'sandstone', 'noun',
   'A yellow block found in deserts, made from compressed sand.',
   '砂岩；在沙漠中发现的黄色方块，由压缩沙子形成。',
   'Sandstone looks great for desert-themed buildings.',
   '砂岩很适合用来建造沙漠主题的建筑。',
   'blocks'),

  ('quartz', 'quartz', 'noun',
   'A white mineral block found in the Nether, used for decoration.',
   '石英；在下界发现的白色矿物方块，用于装饰。',
   'Quartz pillars make my building look like a temple.',
   '石英柱让我的建筑看起来像一座神殿。',
   'blocks'),

  ('iron', 'iron', 'noun',
   'A strong metal ore found underground, used for tools and armor.',
   '铁；在地下发现的坚固金属矿石，用于制作工具和盔甲。',
   'I smelted iron ore to make an iron pickaxe.',
   '我熔炼铁矿石做了一把铁镐。',
   'blocks')

ON CONFLICT (id) DO UPDATE SET
  word          = EXCLUDED.word,
  pos           = EXCLUDED.pos,
  definition_en = EXCLUDED.definition_en,
  definition_zh = EXCLUDED.definition_zh,
  example_en    = EXCLUDED.example_en,
  example_zh    = EXCLUDED.example_zh,
  pixel_icon    = EXCLUDED.pixel_icon;

-- =============================================================================
-- Done. Two vocabulary courses now have lessons and vocab data:
--   - mob-encyclopedia:    12 mob words
--   - building-materials:  10 building material words
-- =============================================================================
