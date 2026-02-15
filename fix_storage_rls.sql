-- Run this in your Supabase SQL Editor to fix the Storage permission error!

-- 1. Ensure the 'profiles' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Avatar Upload Policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete Policy" ON storage.objects;
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;

-- 3. Allow Authenticated users to UPLOAD (Insert) files to their own folder
-- Path format: avatars/{user_id}/filename.jpg
CREATE POLICY "Avatar Upload Policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. Allow Authenticated users to UPDATE their own files
CREATE POLICY "Avatar Update Policy" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. Allow Authenticated users to DELETE their own files
CREATE POLICY "Avatar Delete Policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 6. Allow ANYONE to read the avatars (Public access)
CREATE POLICY "Public Avatar Access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profiles');
