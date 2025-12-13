-- Add referral fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id);
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS credits numeric DEFAULT 0;
-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id uuid REFERENCES profiles(id) NOT NULL,
    referee_id uuid REFERENCES profiles(id) NOT NULL,
    status text CHECK (status IN ('PENDING', 'COMPLETED')) DEFAULT 'PENDING',
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);
-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);