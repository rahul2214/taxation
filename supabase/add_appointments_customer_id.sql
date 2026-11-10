-- ==============================================================================
-- Add missing appointments.customer_id column (UUID -> customers.id)
-- Run in Supabase: Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS customer_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_customer_id_fkey'
  ) THEN
    ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);

-- Backfill customer_id from customer_userid where possible
UPDATE public.appointments a
SET customer_id = c.id
FROM public.customers c
WHERE a.customer_userid = c.userid AND a.customer_id IS NULL;

-- Make PostgREST pick up the new column immediately
NOTIFY pgrst, 'reload schema';
