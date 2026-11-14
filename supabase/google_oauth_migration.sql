-- ==============================================================================
-- Polaris Tax Services - Google Sign-In / Sign-Up Migration
-- Run this in your Supabase Project: Dashboard -> SQL Editor -> New Query -> Run
--
-- Every new Supabase Auth account (email form OR "Continue with Google") gets a
-- public.customers row automatically, so Google users have a profile, wallet and
-- referral code the moment they land on the dashboard. The app also creates the
-- row from the browser (src/lib/supabase/google-auth.ts), so this is a backstop,
-- not a requirement.
--
-- Also required (Supabase Dashboard, not SQL):
--   1. Authentication -> Providers -> Google: enable it and paste the Client ID and
--      Client Secret from Google Cloud Console (APIs & Services -> Credentials ->
--      OAuth client ID, type "Web application").
--      In Google Cloud, add this Authorized redirect URI:
--        https://<your-project-ref>.supabase.co/auth/v1/callback
--   2. Authentication -> URL Configuration -> Redirect URLs: add
--        http://localhost:9002/**
--        https://www.plrstax.com/**
--      (the app returns users to /login or /signup after Google).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::JSONB);
    v_full TEXT := TRIM(COALESCE(v_meta->>'full_name', v_meta->>'name', ''));
    v_first TEXT;
    v_last TEXT;
    v_prefix TEXT;
    v_code TEXT;
BEGIN
    IF NEW.email IS NULL THEN
        RETURN NEW;
    END IF;

    -- Admins have their own table and log in through /admin/login.
    IF EXISTS (SELECT 1 FROM public.admins WHERE LOWER(email) = LOWER(NEW.email)) THEN
        RETURN NEW;
    END IF;

    v_first := COALESCE(
        NULLIF(v_meta->>'first_name', ''),
        NULLIF(v_meta->>'given_name', ''),
        NULLIF(SPLIT_PART(v_full, ' ', 1), ''),
        SPLIT_PART(NEW.email, '@', 1)
    );
    v_last := COALESCE(
        NULLIF(v_meta->>'last_name', ''),
        NULLIF(v_meta->>'family_name', ''),
        NULLIF(TRIM(SUBSTRING(v_full FROM POSITION(' ' IN v_full) + 1)), v_full),
        ''
    );

    v_prefix := LEFT(UPPER(REGEXP_REPLACE(v_first, '[^a-zA-Z]', '', 'g')), 5);
    IF v_prefix = '' THEN v_prefix := 'POLARIS'; END IF;
    v_code := COALESCE(
        NULLIF(v_meta->>'referral_code', ''),
        v_prefix || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 4))
    );

    BEGIN
        INSERT INTO public.customers (id, email, first_name, last_name, phone, role, role_id, referral_code, wallet_balance)
        VALUES (
            NEW.id,
            LOWER(NEW.email),
            v_first,
            v_last,
            NULLIF(v_meta->>'phone', ''),
            'customer',
            2,
            v_code,
            0.00
        )
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Never block account creation because of the profile row; the app retries it.
        RAISE WARNING 'handle_new_auth_user: could not create customer for %: %', NEW.email, SQLERRM;
    END;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_auth_user failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill: Google (or any) accounts created before this migration that have no profile yet.
INSERT INTO public.customers (id, email, first_name, last_name, role, role_id, referral_code, wallet_balance)
SELECT
    u.id,
    LOWER(u.email),
    COALESCE(NULLIF(u.raw_user_meta_data->>'first_name', ''), NULLIF(u.raw_user_meta_data->>'given_name', ''),
             NULLIF(SPLIT_PART(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1), ''),
             SPLIT_PART(u.email, '@', 1)),
    COALESCE(NULLIF(u.raw_user_meta_data->>'last_name', ''), NULLIF(u.raw_user_meta_data->>'family_name', ''), ''),
    'customer',
    2,
    'POLARIS-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || u.id::TEXT) FROM 1 FOR 6)),
    0.00
FROM auth.users u
WHERE u.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.id = u.id OR LOWER(c.email) = LOWER(u.email))
  AND NOT EXISTS (SELECT 1 FROM public.admins a WHERE LOWER(a.email) = LOWER(u.email))
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
