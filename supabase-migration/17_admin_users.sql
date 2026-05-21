-- =============================================================================
-- 17 — Data-driven admin_users table
--
-- Replaces the hard-coded email list inside is_admin() with a managed table.
-- Adding a new admin no longer requires a code/migration release: just insert
-- a row into public.admin_users.
--
-- Backward compatibility: existing email whitelist is seeded into the new
-- table so behaviour is unchanged on first apply.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) admin_users table (uuid PK references auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,                      -- snapshot for ops convenience
  added_at   timestamptz NOT NULL DEFAULT now(),
  added_by   uuid REFERENCES auth.users(id),
  note       text
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only existing admins can read/write the table. Bootstrap row is inserted
-- below with `bypassrls`-equivalent priv (we run as superuser at migration
-- time), so the first admin always gets in.
DROP POLICY IF EXISTS "admin read admin_users" ON public.admin_users;
CREATE POLICY "admin read admin_users"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin manage admin_users" ON public.admin_users;
CREATE POLICY "admin manage admin_users"
  ON public.admin_users FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2) Replace is_admin() to consult the table.
--    Kept SECURITY DEFINER + STABLE so existing RLS USING(public.is_admin())
--    references continue to work without policy changes.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.admin_users a
     WHERE a.user_id = auth.uid()
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ----------------------------------------------------------------------------
-- 3) Bootstrap: seed the original hard-coded admin email if a matching
--    auth.users row exists. Idempotent (ON CONFLICT DO NOTHING).
--    For NEW installs where auth.users hasn't been populated yet, a no-op:
--    operators must manually insert their first admin row after first sign-in.
-- ----------------------------------------------------------------------------
INSERT INTO public.admin_users (user_id, email, note)
  SELECT id, email, 'bootstrapped from is_admin() email whitelist'
    FROM auth.users
   WHERE email = 'zyfjeff@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4) Convenience: allow `authenticated` users to call is_admin() so the
--    front-end can render an Admin entry conditionally without leaking the
--    table itself. Read returns boolean only; no PII exposed.
-- ----------------------------------------------------------------------------
COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if auth.uid() is in public.admin_users. Used by RLS and front-end.';
