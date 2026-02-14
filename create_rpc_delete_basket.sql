-- Create a secure function to delete baskets
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION delete_basket(basket_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with permissions of the function creator (admin), bypasses simple RLS to ensure cascade works
AS $$
DECLARE
  v_user_id uuid;
  v_deleted_count int;
BEGIN
  -- Get the current user ID securely
  v_user_id := auth.uid();

  -- Delete the basket ONLY if it belongs to the user
  -- The items will be deleted automatically via ON DELETE CASCADE constraint on the items table
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
