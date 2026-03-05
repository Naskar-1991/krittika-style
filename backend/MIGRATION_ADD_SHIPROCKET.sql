-- Migration: Add Shiprocket shipping integration fields for PostgreSQL
-- Date: 2026-03-05
-- Database: PostgreSQL 9.6+

-- Add shipping tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_weight DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_shiprocket_generated BOOLEAN DEFAULT FALSE;

-- Add unique constraints for shiprocket_shipment_id and tracking_number
-- WHERE clause excludes NULL values since multiple NULLs should be allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_shiprocket_shipment_id ON orders(shiprocket_shipment_id) WHERE shiprocket_shipment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;

-- Add regular indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_status ON orders(shiprocket_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON orders(user_id, status);

-- Create shipping events table for webhooks
CREATE TABLE IF NOT EXISTS shipping_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipment_id BIGINT,
  event_type VARCHAR(100),
  event_data JSONB,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for shipping_events table
CREATE INDEX IF NOT EXISTS idx_shipping_events_order_id ON shipping_events(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_events_shipment_id ON shipping_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipping_events_event_type ON shipping_events(event_type);
CREATE INDEX IF NOT EXISTS idx_shipping_events_created_at ON shipping_events(created_at DESC);

-- Create tracking history table
CREATE TABLE IF NOT EXISTS tracking_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number VARCHAR(100),
  status VARCHAR(100),
  location VARCHAR(200),
  timestamp TIMESTAMP,
  additional_info JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for tracking_history table
CREATE INDEX IF NOT EXISTS idx_tracking_history_order_id ON tracking_history(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_tracking_number ON tracking_history(tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracking_history_order_tracking ON tracking_history(order_id, tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracking_history_timestamp ON tracking_history(timestamp DESC);
