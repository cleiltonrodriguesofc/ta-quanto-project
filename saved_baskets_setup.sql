-- FIX FOR SCHEMA MISMATCH (imageUrl vs imageurl)
-- Run this in your Supabase SQL Editor

-- 1. Fix saved_basket_items column names
DO $$ 
BEGIN 
    -- Fix imageUrl
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_basket_items' AND column_name='imageurl') THEN
        ALTER TABLE public.saved_basket_items RENAME COLUMN imageurl TO "imageUrl";
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_basket_items' AND column_name='imageUrl') THEN
        ALTER TABLE public.saved_basket_items ADD COLUMN "imageUrl" text;
    END IF;

    -- Fix productName
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_basket_items' AND column_name='productname') THEN
        ALTER TABLE public.saved_basket_items RENAME COLUMN productname TO "productName";
    END IF;
END $$;

-- 2. Ensure table structure is correct for future runs
-- (Included for reference, but the block above fixes existing tables)
/*
create table if not exists public.saved_baskets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  supermarket text not null,
  total_amount numeric not null,
  item_count integer not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.saved_basket_items (
  id uuid default gen_random_uuid() primary key,
  basket_id uuid references public.saved_baskets(id) on delete cascade not null,
  barcode text not null,
  "productName" text not null,
  price numeric not null,
  quantity integer not null,
  "imageUrl" text
);
*/
