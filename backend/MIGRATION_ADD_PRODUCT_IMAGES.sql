-- Migration: Add Product Images Table
-- This migration adds support for multiple images per product

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);

-- Add original_price column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- Populate product_images table with existing main images
INSERT INTO product_images (product_id, image_url, display_order, is_primary)
SELECT id, image, 0, TRUE FROM products WHERE image IS NOT NULL
ON CONFLICT DO NOTHING;
