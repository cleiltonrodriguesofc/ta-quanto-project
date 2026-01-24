-- Run this in your Supabase SQL Editor to allow the migration script to work
-- These policies allow the 'anon' role (which the script uses) to insert data.
-- You can remove or restrict them after the migration is finished.

-- Allow inserts to supermarkets for anon
DROP POLICY IF EXISTS "Allow anon insert to supermarkets" ON public.supermarkets;
CREATE POLICY "Allow anon insert to supermarkets" ON public.supermarkets
FOR INSERT TO anon WITH CHECK (true);

-- Allow inserts to prices for anon
DROP POLICY IF EXISTS "Allow anon insert to prices" ON public.prices;
CREATE POLICY "Allow anon insert to prices" ON public.prices
FOR INSERT TO anon WITH CHECK (true);

-- Allow inserts/upserts to products (cache) for anon
DROP POLICY IF EXISTS "Allow anon insert to products" ON public.products;
CREATE POLICY "Allow anon insert to products" ON public.products
FOR INSERT TO anon WITH CHECK (true);
