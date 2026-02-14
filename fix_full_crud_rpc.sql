-- ROBUST BASKET MANAGEMENT RPCs (FULL CRUD)
-- Run this in your Supabase SQL Editor

-- 1. Secure DELETE Function
CREATE OR REPLACE FUNCTION delete_basket(basket_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_deleted_count int;
BEGIN
  v_user_id := auth.uid();

  DELETE FROM public.saved_baskets
  WHERE id = basket_id AND user_id = v_user_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count > 0 THEN
    RETURN json_build_object('success', true, 'deleted', v_deleted_count);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Basket not found or permission denied');
  END IF;
END;
$$;

-- 2. Secure UPDATE Function
CREATE OR REPLACE FUNCTION update_basket_details(
  p_basket_id uuid,
  p_total_amount numeric,
  p_item_count integer,
  p_items jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_basket_exists boolean;
BEGIN
  v_user_id := auth.uid();

  -- Check ownership
  SELECT EXISTS(SELECT 1 FROM public.saved_baskets WHERE id = p_basket_id AND user_id = v_user_id)
  INTO v_basket_exists;

  IF NOT v_basket_exists THEN
     RETURN json_build_object('success', false, 'error', 'Basket not found or permission denied');
  END IF;

  -- Update Basket Totals
  UPDATE public.saved_baskets
  SET 
    total_amount = p_total_amount,
    item_count = p_item_count,
    created_at = now()
  WHERE id = p_basket_id;

  -- Delete OLD Items
  DELETE FROM public.saved_basket_items WHERE basket_id = p_basket_id;

  -- Insert NEW Items
  INSERT INTO public.saved_basket_items (basket_id, barcode, "productName", price, quantity, "imageUrl")
  SELECT 
    p_basket_id,
    x->>'barcode',
    x->>'productName',
    (x->>'price')::numeric,
    (x->>'quantity')::integer,
    x->>'imageUrl'
  FROM jsonb_array_elements(p_items) AS x;

  RETURN json_build_object('success', true);
END;
$$;

-- 3. Secure CREATE Function (Transactional Insert)
CREATE OR REPLACE FUNCTION create_basket(
  p_name text,
  p_supermarket text,
  p_total_amount numeric,
  p_item_count integer,
  p_items jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_new_basket_id uuid;
BEGIN
  v_user_id := auth.uid();

  -- Insert Basket
  INSERT INTO public.saved_baskets (user_id, name, supermarket, total_amount, item_count)
  VALUES (v_user_id, p_name, p_supermarket, p_total_amount, p_item_count)
  RETURNING id INTO v_new_basket_id;

  -- Insert Items
  IF p_item_count > 0 THEN
      INSERT INTO public.saved_basket_items (basket_id, barcode, "productName", price, quantity, "imageUrl")
      SELECT 
        v_new_basket_id,
        x->>'barcode',
        x->>'productName',
        (x->>'price')::numeric,
        (x->>'quantity')::integer,
        x->>'imageUrl'
      FROM jsonb_array_elements(p_items) AS x;
  END IF;

  RETURN json_build_object('success', true, 'id', v_new_basket_id);
END;
$$;
