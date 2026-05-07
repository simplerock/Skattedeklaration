-- Kör detta i Supabase SQL Editor
ALTER TABLE declarations
ADD COLUMN IF NOT EXISTS power_of_attorney_status TEXT
  NOT NULL DEFAULT 'pending'
  CHECK (power_of_attorney_status IN ('pending','klar','fortsatter','behover_hjalp'));
