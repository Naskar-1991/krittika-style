-- Migration: Add Returns and Refunds functionality
-- Creates tables for managing product returns and refunds

-- Returns Table
CREATE TABLE IF NOT EXISTS returns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'shipped', 'received', 'refunded', 'cancelled'
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    return_date DATE,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Return Items Table (items being returned from an order)
CREATE TABLE IF NOT EXISTS return_items (
    id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE SET NULL,
    order_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL UNIQUE REFERENCES returns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    payment_method VARCHAR(100), -- 'card', 'wallet', 'bank_transfer'
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Return Status History (audit trail)
CREATE TABLE IF NOT EXISTS return_status_history (
    id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100), -- 'user' or admin user email
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refund_status_history_return_id ON return_status_history(return_id);

-- Add return_allowed flag to orders (if not exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_window_days INTEGER DEFAULT 30;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS can_return BOOLEAN DEFAULT TRUE;

-- Add returned quantity tracking to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS returned_quantity INTEGER DEFAULT 0;
