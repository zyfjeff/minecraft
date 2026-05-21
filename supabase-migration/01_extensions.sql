-- =============================================================================
-- 01 — PostgreSQL Extensions
--
-- Self-hosted Supabase's `postgres` image ships with most extensions enabled,
-- but we declare what we explicitly need so a vanilla Postgres also works.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()
-- uuid-ossp is NOT required (we use pgcrypto.gen_random_uuid()), but enable
-- it in case any future migration wants uuid_generate_v4().
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
