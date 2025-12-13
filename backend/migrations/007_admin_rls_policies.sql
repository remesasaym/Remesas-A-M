-- Migration: Admin RLS Policies for Profiles and Settings
-- This allows admins to view all user profiles and manage settings

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view settings" ON settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON settings;
DROP POLICY IF EXISTS "Admins can update settings" ON settings;

-- Create policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'pineroanthony2@gmail.com'
  OR 
  auth.uid() = '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda'::uuid
);

-- Create policy to allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
USING (
  auth.jwt() ->> 'email' = 'pineroanthony2@gmail.com'
  OR 
  auth.uid() = '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda'::uuid
);

-- Create policies for settings table
CREATE POLICY "Admins can view settings"
ON settings
FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'pineroanthony2@gmail.com'
  OR 
  auth.uid() = '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda'::uuid
);

CREATE POLICY "Admins can insert settings"
ON settings
FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'email' = 'pineroanthony2@gmail.com'
  OR 
  auth.uid() = '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda'::uuid
);

CREATE POLICY "Admins can update settings"
ON settings
FOR UPDATE
USING (
  auth.jwt() ->> 'email' = 'pineroanthony2@gmail.com'
  OR 
  auth.uid() = '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda'::uuid
);

-- Note: Replace 'pineroanthony2@gmail.com' with your actual admin email
-- and '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda' with your actual admin user ID
