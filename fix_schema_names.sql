-- Rename columns to match camelCase expectations from JS
-- Postgres stores unquoted identifiers as lowercase, but our API sends camelCase.
-- We rename them to quoted identifiers to enforce case sensitivity.

ALTER TABLE public.prices RENAME COLUMN productname TO "productName";
ALTER TABLE public.prices RENAME COLUMN imageurl TO "imageUrl";
ALTER TABLE public.prices RENAME COLUMN user_id TO "userId";

-- Ensure other columns are correct (if needed)
-- ALTER TABLE public.prices RENAME COLUMN supermarket TO "supermarket"; -- already lowercase matches
-- ALTER TABLE public.prices RENAME COLUMN barcode TO "barcode"; -- already lowercase matches

-- Fix Products table similarly if needed
ALTER TABLE public.products RENAME COLUMN imageurl TO "imageUrl";
ALTER TABLE public.products RENAME COLUMN createdat TO "createdAt";
