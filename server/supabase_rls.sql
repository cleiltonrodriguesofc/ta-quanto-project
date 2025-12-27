-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supermarkets ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow new users to insert their profile (during sign up)
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Products Table Policies
-- Allow everyone to view products (authenticated or not)
CREATE POLICY "Public products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Allow authenticated users to insert new products
CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Prices Table Policies
-- Allow everyone to view prices
CREATE POLICY "Public prices are viewable by everyone" ON prices
  FOR SELECT USING (true);

-- Allow authenticated users to insert new prices
CREATE POLICY "Authenticated users can insert prices" ON prices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Supermarkets Table Policies
-- Allow everyone to view supermarkets
CREATE POLICY "Public supermarkets are viewable by everyone" ON supermarkets
  FOR SELECT USING (true);

-- Allow authenticated users to insert new supermarkets
CREATE POLICY "Authenticated users can insert supermarkets" ON supermarkets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
