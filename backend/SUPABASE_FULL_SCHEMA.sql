-- ============================================================
-- Krittika Style — Full Database Schema for Supabase
-- Run this entire file in Supabase SQL Editor (once, on a fresh DB)
-- ============================================================

-- ==================== CORE SCHEMA ====================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500),
    description TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    shipping_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==================== CATEGORIES ====================

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

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

INSERT INTO categories (name, slug, description, display_order, is_active) VALUES
  ('Sarees', 'sarees', 'Traditional and designer sarees', 1, TRUE),
  ('Silk Sarees', 'silk-sarees', 'Premium silk sarees', 2, TRUE),
  ('Cotton Sarees', 'cotton-sarees', 'Comfortable cotton sarees', 3, TRUE),
  ('Designer Sarees', 'designer-sarees', 'Exclusive designer collection', 4, TRUE),
  ('Bridal Sarees', 'bridal-sarees', 'Wedding and bridal sarees', 5, TRUE)
ON CONFLICT (name) DO NOTHING;

-- ==================== OTP VERIFICATION ====================

ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_otp_sent TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_complete BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_mobile_verified ON users(mobile_verified);

-- ==================== PRODUCT IMAGES ====================

CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);

ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- ==================== REVIEWS ====================

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    helpful_count INTEGER DEFAULT 0,
    unhelpful_count INTEGER DEFAULT 0,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    flagged_at TIMESTAMP,
    flag_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_flagged ON reviews(is_flagged);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged_at ON reviews(flagged_at DESC);

CREATE OR REPLACE FUNCTION update_review_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_updated_timestamp ON reviews;
CREATE TRIGGER review_updated_timestamp
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_review_timestamp();

-- ==================== WISHLIST ====================

CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_product ON wishlist(user_id, product_id);

-- ==================== RETURNS & REFUNDS ====================

CREATE TABLE IF NOT EXISTS returns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    return_date DATE,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS return_items (
    id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE SET NULL,
    order_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL UNIQUE REFERENCES returns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS return_status_history (
    id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refund_status_history_return_id ON return_status_history(return_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_window_days INTEGER DEFAULT 30;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS can_return BOOLEAN DEFAULT TRUE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS returned_quantity INTEGER DEFAULT 0;

-- ==================== PAYMENT (RAZORPAY) ====================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);

-- ==================== SHIPROCKET SHIPPING ====================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_weight DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_shiprocket_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_shiprocket_shipment_id ON orders(shiprocket_shipment_id) WHERE shiprocket_shipment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id ON orders(shiprocket_order_id) WHERE shiprocket_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_status ON orders(shiprocket_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON orders(user_id, status);

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

CREATE INDEX IF NOT EXISTS idx_shipping_events_order_id ON shipping_events(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_events_shipment_id ON shipping_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipping_events_event_type ON shipping_events(event_type);
CREATE INDEX IF NOT EXISTS idx_shipping_events_created_at ON shipping_events(created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_tracking_history_order_id ON tracking_history(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_tracking_number ON tracking_history(tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracking_history_order_tracking ON tracking_history(order_id, tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracking_history_timestamp ON tracking_history(timestamp DESC);

-- ==================== SITE SETTINGS / LOGO ====================

CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    logo_url VARCHAR(500),
    logo_alt_text VARCHAR(255),
    site_name VARCHAR(255) DEFAULT 'Krittika Style',
    site_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_settings (site_name, site_description)
VALUES ('Krittika Style', 'Your Premium Fashion Destination')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_site_settings_id ON site_settings(id);

-- ==================== COUPONS ====================

CREATE TABLE IF NOT EXISTS coupons (
    id            SERIAL PRIMARY KEY,
    code          VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2),
    max_discount_amount NUMERIC(10, 2),
    max_uses      INTEGER,
    used_count    INTEGER NOT NULL DEFAULT 0,
    expires_at    TIMESTAMPTZ,
    description   TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== BANNERS ====================

CREATE TABLE IF NOT EXISTS banners (
    id         SERIAL PRIMARY KEY,
    image_url  TEXT NOT NULL,
    title      VARCHAR(255),
    link_url   VARCHAR(500),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== FIX ORDERS SERIAL SEQUENCE ====================

DO $$
DECLARE seq_name text;
BEGIN
  SELECT pg_get_serial_sequence('orders', 'id') INTO seq_name;
  IF seq_name IS NULL THEN
    CREATE SEQUENCE IF NOT EXISTS orders_id_seq;
    ALTER TABLE orders ALTER COLUMN id SET DEFAULT nextval('orders_id_seq');
    PERFORM setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 0) + 1, false);
    ALTER SEQUENCE orders_id_seq OWNED BY orders.id;
  END IF;
END $$;

-- ==================== ADMIN USER ====================
-- Default admin: email=admin@krittikastyle.com, password=admin123
-- IMPORTANT: Change this password immediately after first login!

INSERT INTO users (name, email, password, role, created_at)
VALUES (
  'Admin',
  'admin@krittikastyle.com',
  '$2b$10$TN4p3xGSVWD/vI94qI.Xxumq4H5ePWBxNbVEE8rKdZ7QzIbdT9XSm',
  'admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- ============================================================
-- Done! All tables created. Connect your backend via DATABASE_URL.
-- ============================================================
