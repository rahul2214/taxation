-- ==============================================================================
-- Polaris Tax Services - Email Verification (sent by Firebase) Migration
-- Run this in your Supabase Project: Dashboard -> SQL Editor -> New Query -> Run
--
-- New email/password customers start unverified and can't sign in until they click
-- the link Firebase emails them. Google sign-ins are never blocked (Google already
-- verified the address). Everyone who exists today is marked verified.
--
-- Also required:
--   Supabase: Authentication -> Providers -> Email -> turn OFF "Confirm email"
--             (Firebase sends the verification email now, not Supabase).
--   Firebase: Authentication -> Sign-in method -> enable Email/Password.
--   Firebase: Authentication -> Templates -> (pencil icon) -> Customize action URL ->
--             https://www.plrstax.com/auth/action
--             (applies to the verification AND password reset emails; edit the sender
--              name and subject in the same Templates screen).
--   Firebase: Authentication -> Settings -> Authorized domains: add www.plrstax.com.
--   .env:     NEXT_PUBLIC_FIREBASE_API_KEY and SUPABASE_SERVICE_ROLE_KEY must be set.
-- ==============================================================================

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN;

-- Existing customers were created before verification existed: treat them as verified.
UPDATE public.customers SET email_verified = TRUE WHERE email_verified IS NULL;

ALTER TABLE public.customers ALTER COLUMN email_verified SET DEFAULT FALSE;
ALTER TABLE public.customers ALTER COLUMN email_verified SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_email_verified ON public.customers(email_verified);

NOTIFY pgrst, 'reload schema';
