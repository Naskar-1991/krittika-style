-- Migration: Add shiprocket_order_id to orders table
-- This stores the Shiprocket internal order ID returned when an order is created,
-- which is required for order cancellation via the Shiprocket API.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id
  ON orders(shiprocket_order_id)
  WHERE shiprocket_order_id IS NOT NULL;
