# CraftWords — Supabase 迁移脚本

本目录是数据库部署的**唯一权威来源**。每个文件都是幂等的（`IF NOT EXISTS` /
`OR REPLACE` / `ON CONFLICT DO UPDATE`），按数字前缀顺序执行，重复运行无副作用。

适用场景：
- 首次部署到 **Supabase Cloud** 项目
- 迁移到 **自建 / 阿里云 Supabase**（基于 `supabase/postgres` 镜像）
- 测试库整库重置后重建

---

## 一、前置条件

执行前确认目标实例满足：

1. **PostgreSQL 14+**，`supabase/postgres` 镜像（自带 `auth` schema、
   `auth.uid()` / `auth.jwt()`、`anon` / `authenticated` / `service_role` 角色）。
2. **GoTrue (auth) 已就绪**：能用 Supabase JS SDK 注册/登录。脚本只依赖
   `auth.users(id uuid)` 一张表存在，不重建 auth schema。
3. **psql 直连权限**：能用 `postgres` 超级用户身份执行 DDL 与
   `CREATE TRIGGER ON auth.users`（`06_auth_triggers.sql` 需要）。
4. **RLS 默认开启**（self-hosted 与 Supabase Cloud 默认开启）。

---

## 二、文件分层与执行顺序

按数字前缀逐个执行。19 个文件可分为 4 层：

### A. 基础设施（01–07，必须，按顺序）

| 顺序 | 文件 | 作用 |
|---|---|---|
| 01 | `01_extensions.sql` | 启用 `pgcrypto` 扩展 |
| 02 | `02_core_schema.sql` | `profiles` / `quests` / `quest_completions` / `achievements` / `user_achievements` + RLS |
| 03 | `03_courses_schema.sql` | `courses` / `lessons` / `vocab` / `questions` / `user_course_progress` / `lesson_segments` / `user_segment_attempts` / `user_lesson_reports` + RLS |
| 04 | `04_vocab_enhance.sql` | 给 `vocab` 加 `synonyms` / `minecraft_role` / `minecraft_obtain` 三列 |
| 05 | `05_functions.sql` | RPC：`set_updated_at()` / `is_admin()` / `bump_streak()` |
| 06 | `06_auth_triggers.sql` | `on auth.users insert` 自动建 profile 触发器 |
| 07 | `07_admin_rls.sql` | 管理员对所有内容表的 CRUD 策略（基于 `is_admin()`） |

### B. 内容种子（08–13、15–16，按顺序，可按需精简）

| 顺序 | 文件 | 内容 |
|---|---|---|
| 08 | `08_seed_achievements.sql` | 8 个成就 |
| 09 | `09_seed_courses.sql` | Listening 课程 + lessons + questions |
| 10 | `10_seed_vocab.sql` | vocab 词典基础种子 |
| 11 | `11_seed_reading.sql` | Reading 课程材料 |
| 12 | `12_seed_segments.sql` | 视频课分段 + 多题型 |
| 13 | `13_seed_quests.sql` | 12 条 quest 目录（4 kind × 3，按 UTC 天轮换） |
| 15 | `15_seed_vocab_courses.sql` | 68 条 vocabulary 词条 |
| 16 | `16_seed_vocab_course_structure.sql` | 10 门 vocabulary 课程 + lessons |

> ⚠️ 编号 14 不是种子，是策略调整，见下一层。

### C. 功能增量（14、17、18，按顺序）

| 顺序 | 文件 | 作用 |
|---|---|---|
| 14 | `14_anon_read_access.sql` | 给 `anon` 角色开 `courses` / `lessons` / `vocab` / `lesson_segments` / `questions` 只读策略，支持游客浏览 |
| 17 | `17_admin_users.sql` | **数据驱动 admin**：新建 `admin_users` 表 + 重写 `is_admin()` 改读表，并把 `05_functions.sql` 里硬编码邮箱作为 bootstrap 行写入。**该文件运行后，添加 admin 不再需要改代码** |
| 18 | `18_courses_card_view.sql` | `courses_card_view` 视图，把 CourseList 列表的 `lessons` 子查询服务端聚合，O(courses × lessons) → O(courses) |

### D. 一次性 backfill（19，仅对从早期版本升级的库需要）

| 顺序 | 文件 | 作用 |
|---|---|---|
| 19 | `19_backfill_vocab_thumbnails.sql` | 把 vocabulary 课程默认 `thumbnail_key='blocks'` 修正为 `v_*` 专属图标体系 |

> 全新部署时 19 也可以执行（条件是 `thumbnail_key = 'blocks'`，对新种子是 no-op）。

---

## 三、一键执行

把连接串写到环境变量后执行 `run-all.sh`：

```bash
export DATABASE_URL="postgresql://postgres:<password>@<host>:5432/postgres"
cd supabase-migration
./run-all.sh
```

脚本行为：
- 自动发现所有 `[0-9][0-9]_*.sql`，按字典序执行
- 每个文件 `--single-transaction` + `-v ON_ERROR_STOP=1`
- 任一语句失败立即中止并打印文件名/行号

---

## 四、迁移后必做配置

### 1. 设置 admin（17 之后改用数据驱动）

`17_admin_users.sql` 用 `auth.jwt() ->> 'email'` 查 `admin_users` 表里是否
存在对应 `user_id`。新增 admin 的方式（任选其一）：

**方式 A：迁移完成、用户首次登录后，用 SQL 直接写入：**

```sql
INSERT INTO public.admin_users (user_id, email, note)
SELECT id, email, 'bootstrap admin'
FROM auth.users WHERE email = 'you@example.com'
ON CONFLICT (user_id) DO NOTHING;
```

**方式 B：先注册账号 → 改 17 里的邮箱 → 跑迁移**。bootstrap INSERT 是一次性查
`auth.users` 取取该邮箱的 `user_id`，后续登录不会重新触发。所以顺序必须是：

```
01–16 跑迁移 → 前端注册 admin 账号 → 改 17 末尾邮箱 → 手工跑 17 / run-all.sh
```

推荐新部署默认走方式 A，B 只适合交付给同事反复重建的场景。

### 2. 更新前端 `.env.local`

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

参考根目录 `.env.local.example`。改完重新 `npm run build`。

### 3. （可选）迁移用户数据

本目录只负责**结构 + 内容种子**，不含用户数据。要搬云端用户：

- **auth.users**：走 GoTrue admin API（[官方迁移文档](https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects)），不能 `pg_dump`
- **业务表（profiles / quest_completions / user_achievements / user_course_progress / user_segment_attempts / user_lesson_reports）**：

```bash
pg_dump --data-only --no-owner \
  -t public.profiles \
  -t public.quest_completions \
  -t public.user_achievements \
  -t public.user_course_progress \
  -t public.user_segment_attempts \
  -t public.user_lesson_reports \
  "$SOURCE_DB_URL" > user_data.sql
psql "$TARGET_DB_URL" -f user_data.sql
```

外键 `references auth.users(id) on delete cascade` 要求先迁 auth.users。

---

## 五、回滚 / 整库重置

所有 DDL 都用 `IF NOT EXISTS` / `OR REPLACE`，重复运行不破坏数据。
彻底重置：

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
```

然后从 `01_extensions.sql` 重新跑一遍 `run-all.sh`。

> ⚠️ `auth` schema 保持不动，否则要重建 GoTrue。

---

## 六、文件速查

```
01_extensions.sql                    扩展
02_core_schema.sql                   profiles + quests + achievements
03_courses_schema.sql                courses + lessons + vocab + segments
04_vocab_enhance.sql                 vocab 同义词/Minecraft 元数据
05_functions.sql                     set_updated_at / is_admin / bump_streak
06_auth_triggers.sql                 auth.users → profiles 自动建档
07_admin_rls.sql                     管理员 RLS 策略
08_seed_achievements.sql             8 个成就
09_seed_courses.sql                  Listening 课程
10_seed_vocab.sql                    vocab 词典
11_seed_reading.sql                  Reading 材料
12_seed_segments.sql                 视频课分段 + 多题型
13_seed_quests.sql                   12 条 quest（按 UTC 天轮换）
14_anon_read_access.sql              游客浏览 RLS
15_seed_vocab_courses.sql            68 个 vocabulary 词条
16_seed_vocab_course_structure.sql   10 门 vocabulary 课程
17_admin_users.sql                   admin 数据驱动（替代邮箱白名单）
18_courses_card_view.sql             CourseList 性能视图
19_backfill_vocab_thumbnails.sql     vocab 课程 v_* 图标 backfill
README.md                            本文件
run-all.sh                           psql 顺序执行器
```
