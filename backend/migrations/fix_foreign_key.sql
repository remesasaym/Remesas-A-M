-- Ensure foreign key relationship exists between verification_requests and profiles
-- This is required for the join query in the admin panel to work

ALTER TABLE verification_requests 
DROP CONSTRAINT IF EXISTS verification_requests_user_id_fkey;

ALTER TABLE verification_requests
ADD CONSTRAINT verification_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
