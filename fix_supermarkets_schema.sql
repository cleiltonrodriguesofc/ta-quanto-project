-- Add missing columns to supermarkets table
-- Using quoted identifiers to ensure case sensitivity if needed, though usually standard columns are fine.
-- However, TypeScript types expect 'type', 'address', 'latitude', 'longitude'.

ALTER TABLE public.supermarkets ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE public.supermarkets ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE public.supermarkets ADD COLUMN IF NOT EXISTS "latitude" numeric;
ALTER TABLE public.supermarkets ADD COLUMN IF NOT EXISTS "longitude" numeric;

-- Set default values for existing rows if needed
UPDATE public.supermarkets SET "type" = 'Supermarket' WHERE "type" IS NULL;
