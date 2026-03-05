-- Add payment-related columns to orders table
-- Run this migration to enable Razorpay payment integration

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'; 
-- pending, completed, failed, refunded

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
-- Card, UPI, NetBanking, etc.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
-- Razorpay order ID

ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
-- Razorpay payment ID (after successful payment)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);
-- Razorpay signature for verification

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);
-- Amount paid (in case of partial payment)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
-- When payment was completed

-- Create index for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
