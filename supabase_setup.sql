-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Users Table (extends Supabase Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Users
alter table public.users enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.users for select
  using ( true );

create policy "Users can insert their own profile."
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

-- Create Prices Table
create table public.prices (
  id uuid default gen_random_uuid() primary key,
  productName text not null,
  price numeric not null,
  supermarket text not null,
  barcode text not null,
  brand text,
  imageUrl text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  location jsonb,
  user_id uuid references public.users(id)
);

-- Enable RLS for Prices
alter table public.prices enable row level security;

create policy "Prices are viewable by everyone."
  on public.prices for select
  using ( true );

create policy "Authenticated users can insert prices."
  on public.prices for insert
  with check ( auth.role() = 'authenticated' );

-- Create Products Cache Table
create table public.products (
  barcode text primary key,
  name text,
  brand text,
  imageUrl text,
  createdAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Products
alter table public.products enable row level security;

create policy "Products are viewable by everyone."
  on public.products for select
  using ( true );

create policy "Authenticated users can insert products."
  on public.products for insert
  with check ( auth.role() = 'authenticated' );

-- Create Supermarkets Table (if needed for list)
create table public.supermarkets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  count integer default 0
);

-- Enable RLS for Supermarkets
alter table public.supermarkets enable row level security;

create policy "Supermarkets are viewable by everyone."
  on public.supermarkets for select
  using ( true );
