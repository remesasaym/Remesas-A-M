-- Add phone column to verification_requests if it doesn't exist
ALTER TABLE verification_requests 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Refresh schema cache (Supabase specific)
NOTIFY pgrst, 'reload config';
