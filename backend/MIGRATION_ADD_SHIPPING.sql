-- Database Migration: Add shipping_info column to orders table
-- Run this migration to enable shipping information storage

-- Check if column exists (PostgreSQL)
-- If it doesn't exist, this will add it
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT NULL;

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name='orders' AND column_name='shipping_info';

-- Update existing orders to have empty shipping info if NULL
UPDATE orders SET shipping_info = '{}'::jsonb WHERE shipping_info IS NULL;

-- Create index for better performance on shipping info queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping ON orders(shipping_info);

-- Verify the migration
\d orders
