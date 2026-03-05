-- Migration: Add Categories Table
-- This migration adds support for product categories

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add category_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Insert default categories
INSERT INTO categories (name, slug, description, display_order, is_active) 
VALUES 
  ('Electronics', 'electronics', 'Electronic devices and gadgets', 1, TRUE),
  ('Fashion', 'fashion', 'Clothing and fashion accessories', 2, TRUE),
  ('Home & Living', 'home-living', 'Home decor and living essentials', 3, TRUE),
  ('Books & Media', 'books-media', 'Books, movies, and media', 4, TRUE),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports and outdoor equipment', 5, TRUE)
ON CONFLICT (name) DO NOTHING;
