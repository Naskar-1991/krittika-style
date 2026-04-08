-- Migration: Add OTP Verification Fields to Users Table
-- This migration adds support for OTP-based mobile number verification

-- Add OTP-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_otp_sent TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_complete BOOLEAN DEFAULT false;

-- Add index for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_mobile_verified ON users(mobile_verified);
