-- Add review fields to verification_requests table
-- Required for Admin KYC Review Panel

ALTER TABLE verification_requests 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT NULL;

COMMENT ON COLUMN verification_requests.reviewed_at IS 'Timestamp when admin reviewed the request';
COMMENT ON COLUMN verification_requests.rejection_reason IS 'Reason for rejection if status is rejected';
COMMENT ON COLUMN verification_requests.admin_notes IS 'Internal notes from admin';
