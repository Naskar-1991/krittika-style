-- Migration: Add Logo Management Table
-- This migration adds a settings table for managing site logo and other configurations

CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    logo_url VARCHAR(500),
    logo_alt_text VARCHAR(255),
    site_name VARCHAR(255) DEFAULT 'Krittika Style',
    site_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO site_settings (site_name, site_description) 
VALUES ('Krittika Style', 'Your Premium Fashion Destination')
ON CONFLICT DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_id ON site_settings(id);
