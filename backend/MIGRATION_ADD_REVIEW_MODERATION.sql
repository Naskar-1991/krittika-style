-- Migration: Add Admin Review Moderation Columns
-- This migration adds columns for admin review moderation features

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS flag_reason VARCHAR(255);

-- Create index for flagged reviews
CREATE INDEX IF NOT EXISTS idx_reviews_is_flagged ON reviews(is_flagged);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged_at ON reviews(flagged_at DESC);
