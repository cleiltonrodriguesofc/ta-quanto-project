-- Allow authenticated users to update prices
-- This is necessary for .upsert() to work when a row already exists.
-- Without this, you get "new row violates row-level security policy (USING expression)"

create policy "Authenticated users can update prices"
  on public.prices for update
  using ( auth.role() = 'authenticated' )
  with check ( auth.role() = 'authenticated' );

-- Optional: Allow users to delete prices if needed (not strictly required for upsert)
-- create policy "Authenticated users can delete prices"
--   on public.prices for delete
--   using ( auth.role() = 'authenticated' );
