-- FIX FOR SAVED BASKETS RLS (DELETE ISSUE)
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE public.saved_baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_basket_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view their own baskets" ON public.saved_baskets;
DROP POLICY IF EXISTS "Users can insert their own baskets" ON public.saved_baskets;
DROP POLICY IF EXISTS "Users can update their own baskets" ON public.saved_baskets;
DROP POLICY IF EXISTS "Users can delete their own baskets" ON public.saved_baskets;

DROP POLICY IF EXISTS "Users can view their own basket items" ON public.saved_basket_items;
DROP POLICY IF EXISTS "Users can insert their own basket items" ON public.saved_basket_items;
DROP POLICY IF EXISTS "Users can update their own basket items" ON public.saved_basket_items;
DROP POLICY IF EXISTS "Users can delete their own basket items" ON public.saved_basket_items;

-- 3. Create Policies for SAVED_BASKETS
-- SELECT
CREATE POLICY "Users can view their own baskets" 
ON public.saved_baskets FOR SELECT 
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own baskets" 
ON public.saved_baskets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own baskets" 
ON public.saved_baskets FOR UPDATE 
USING (auth.uid() = user_id);

-- DELETE (This is likely the missing one!)
CREATE POLICY "Users can delete their own baskets" 
ON public.saved_baskets FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Create Policies for SAVED_BASKET_ITEMS
-- Note: saved_basket_items usually rely on the parent basket for ownership, 
-- but we can link via INNER JOIN or just assume if they can access the basket they can access items.
-- A simple approach for items is: check if the basket belongs to the user.

-- SELECT Items
CREATE POLICY "Users can view their own basket items" 
ON public.saved_basket_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.saved_baskets b 
        WHERE b.id = saved_basket_items.basket_id 
        AND b.user_id = auth.uid()
    )
);

-- INSERT Items
CREATE POLICY "Users can insert their own basket items" 
ON public.saved_basket_items FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.saved_baskets b 
        WHERE b.id = saved_basket_items.basket_id 
        AND b.user_id = auth.uid()
    )
);

-- DELETE Items
CREATE POLICY "Users can delete their own basket items" 
ON public.saved_basket_items FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.saved_baskets b 
        WHERE b.id = saved_basket_items.basket_id 
        AND b.user_id = auth.uid()
    )
);
