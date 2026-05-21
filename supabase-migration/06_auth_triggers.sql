-- =============================================================================
-- 06 — Auth triggers: auto-create a profile row whenever a new auth user
--      signs up (so the front-end never has to retry an empty SELECT).
--
-- Depends on:
--   - public.profiles (02_core_schema.sql)
--
-- Idempotent. The trigger is on auth.users so requires the postgres
-- (super)user — make sure you're connected as the role that owns the auth
-- schema (default in self-hosted Supabase: `postgres`).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fallback_name text;
BEGIN
  -- Prefer the display_name passed via user_metadata at signup time;
  -- otherwise derive a friendly default from the email local-part.
  fallback_name := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'Adventurer'
  );

  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, fallback_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
