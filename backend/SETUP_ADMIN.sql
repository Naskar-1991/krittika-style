-- Quick setup to test admin features
-- Run this in PostgreSQL to create/upgrade a test admin user

-- Option 1: If you already have a user registered, make them admin
UPDATE users SET role='admin' WHERE email='admin@shopbhub.com' LIMIT 1;

-- Option 2: If no admin exists, create one with bcrypt hash of "admin123"
-- Hash: $2b$10$TN4p3xGSVWD/vI94qI.Xxumq4H5ePWBxNbVEE8rKdZ7QzIbdT9XSm (admin123)
INSERT INTO users (name, email, password, role, created_at) 
VALUES (
  'Admin User', 
  'admin@shopbhub.com', 
  '$2b$10$TN4p3xGSVWD/vI94qI.Xxumq4H5ePWBxNbVEE8rKdZ7QzIbdT9XSm', 
  'admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE 
SET role='admin', password='$2b$10$TN4p3xGSVWD/vI94qI.Xxumq4H5ePWBxNbVEE8rKdZ7QzIbdT9XSm';

-- Verify admin user exists
SELECT id, name, email, role FROM users WHERE role='admin';

-- If no users exist at all, you need to signup first via the app frontend
-- Then run: UPDATE users SET role='admin' WHERE id=1;
