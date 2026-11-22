-- ==============================================================================
-- Polaris Tax Services - Email Verification (sent with Resend) Migration
-- Run this in your Supabase Project: Dashboard -> SQL Editor -> New Query -> Run
--
-- New email/password customers start unverified and can't sign in until they click
-- the link emailed to them (sent with Resend). Google sign-ins are never blocked
-- (Google already verified the address). Everyone who exists today is marked verified.
--
-- Also required:
--   Supabase: Authentication -> Providers -> Email -> turn OFF "Confirm email"
--             (the site sends the verification email with Resend, not Supabase).
--   Resend:   Domains -> add and verify your sending domain (e.g. plrstax.com),
--             then API Keys -> create a key with "Sending access".
--   .env:     RESEND_API_KEY, RESEND_FROM_EMAIL (e.g. "Polaris Tax Services <no-reply@plrstax.com>"),
--             SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SITE_URL must be set.
--             AUTH_TOKEN_SECRET (optional, long random string) signs the email links;
--             if unset, the service role key is used.
-- ==============================================================================

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN;

-- Existing customers were created before verification existed: treat them as verified.
UPDATE public.customers SET email_verified = TRUE WHERE email_verified IS NULL;

ALTER TABLE public.customers ALTER COLUMN email_verified SET DEFAULT FALSE;
ALTER TABLE public.customers ALTER COLUMN email_verified SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_email_verified ON public.customers(email_verified);

NOTIFY pgrst, 'reload schema';
