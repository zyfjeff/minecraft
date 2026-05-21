-- =============================================================================
-- 05 — RPC / helper functions
--
-- Depends on the core tables from 02_core_schema.sql.
--
-- Functions:
--   1. set_updated_at()  — generic BEFORE UPDATE trigger helper
--                          (also defined in 02 for ordering safety; re-asserted
--                          here so this file is the canonical source)
--   2. is_admin()        — email-whitelist gate used by 07_admin_rls.sql
--   3. bump_streak()     — called from the front-end after a quest claim;
--                          idempotently advances profile.streak based on the
--                          gap between today and last_quest_on (resets to 1
--                          on a gap >1 day, +1 on consecutive days, no-op on
--                          same-day re-claim).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) set_updated_at (canonical definition)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2) is_admin
--
-- Returns true when the JWT email is in the whitelist below.
-- *** REMEMBER TO REPLACE THE EMAIL WITH YOURS BEFORE GOING TO PROD ***
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') IN (
    'zyfjeff@gmail.com'
    -- , 'another-admin@example.com'
  )
$$;

-- ----------------------------------------------------------------------------
-- 3) bump_streak
--
-- Idempotent daily streak roll-over for the *calling* user.
--   - First claim ever              -> streak := 1, last_quest_on := today
--   - Same-day re-claim             -> no change
--   - Yesterday was last claim      -> streak += 1, last_quest_on := today
--   - Gap of >1 day                 -> streak := 1, last_quest_on := today
--
-- Returns the new streak value so the front-end can optimistically update
-- without a follow-up SELECT.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bump_streak()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid           uuid := auth.uid();
  today_utc     date := (now() AT TIME ZONE 'UTC')::date;
  prev_date     date;
  prev_streak   integer;
  new_streak    integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'bump_streak: no authenticated user';
  END IF;

  SELECT last_quest_on, COALESCE(streak, 0)
    INTO prev_date, prev_streak
  FROM public.profiles
  WHERE id = uid
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Profile not yet created (race with the auth trigger). Insert default row.
    INSERT INTO public.profiles (id, streak, last_quest_on)
    VALUES (uid, 1, today_utc)
    ON CONFLICT (id) DO UPDATE
      SET streak = 1,
          last_quest_on = today_utc;
    RETURN 1;
  END IF;

  IF prev_date = today_utc THEN
    new_streak := GREATEST(prev_streak, 1);
  ELSIF prev_date = today_utc - INTERVAL '1 day' THEN
    new_streak := prev_streak + 1;
  ELSE
    -- includes prev_date IS NULL and gap > 1 day
    new_streak := 1;
  END IF;

  UPDATE public.profiles
     SET streak        = new_streak,
         last_quest_on = today_utc
   WHERE id = uid;

  RETURN new_streak;
END;
$$;

-- Make sure the RPCs are callable by signed-in users via PostgREST.
GRANT EXECUTE ON FUNCTION public.is_admin()    TO authenticated;
GRANT EXECUTE ON FUNCTION public.bump_streak() TO authenticated;
