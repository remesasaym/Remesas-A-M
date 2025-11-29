-- Add AI validation fields to verification_requests table
-- This enables hybrid verification: AI pre-validation + manual admin review

ALTER TABLE verification_requests 
ADD COLUMN IF NOT EXISTS ai_validation JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT NULL, -- 0.00 to 1.00
ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN verification_requests.ai_validation IS 'JSON object containing AI validation results from Gemini';
COMMENT ON COLUMN verification_requests.ai_confidence IS 'Overall confidence score from AI (0.00 to 1.00)';
COMMENT ON COLUMN verification_requests.requires_manual_review IS 'Whether this verification needs manual admin review';
COMMENT ON COLUMN verification_requests.auto_approved IS 'Whether this was automatically approved by AI';

-- Create index for filtering verifications that need manual review
CREATE INDEX IF NOT EXISTS idx_verification_manual_review 
ON verification_requests(requires_manual_review, status) 
WHERE requires_manual_review = TRUE AND status = 'pending';
