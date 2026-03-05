# Category Setup - Database Migration Guide

## ⚠️ Problem: Categories Not Showing in Product List

If categories are not appearing in the backend product listing grid, follow these steps:

## 🔧 Solution: Run the Database Migration

### Step 1: Connect to PostgreSQL

```bash
# Option 1: Using psql command line
psql -U postgres -h localhost

# Option 2: If using a different user
psql -U <your_db_user> -h localhost -d <your_database_name>
```

### Step 2: Copy and Run This Migration Script

Once connected to your PostgreSQL database, run these SQL commands:

```sql
-- Create categories table if it doesn't exist
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

-- Add category_id column to products table if missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Add foreign key constraint if not already present
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT constraint_type FROM information_schema.table_constraints 
        WHERE table_name = 'products' AND constraint_name = 'fk_product_category'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT fk_product_category 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Insert default categories (won't duplicate if they already exist)
INSERT INTO categories (name, slug, description, display_order, is_active) 
VALUES 
  ('Electronics', 'electronics', 'Electronic devices and gadgets', 1, TRUE),
  ('Fashion', 'fashion', 'Clothing and fashion accessories', 2, TRUE),
  ('Home & Living', 'home-living', 'Home decor and living essentials', 3, TRUE),
  ('Books & Media', 'books-media', 'Books, movies, and media', 4, TRUE),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports and outdoor equipment', 5, TRUE)
ON CONFLICT (name) DO NOTHING;
```

### Step 3: Verify the Setup

Run these commands to verify everything is in place:

```sql
-- Check if categories table exists and has data
SELECT COUNT(*) as category_count FROM categories;

-- Check if products table has category_id column
SELECT column_name FROM information_schema.columns 
WHERE table_name='products' AND column_name='category_id';

-- View all categories
SELECT id, name, slug, is_active FROM categories ORDER BY display_order;
```

### Step 4: Restart Your Application

After running the migration:

```bash
# Terminal 1: Restart Backend
cd backend
node server.js

# Terminal 2: Restart Frontend (if needed)
npm start
```

## ✅ Verification Steps

1. **Open Admin Panel**: Navigate to `/admin/products`
2. **Check Product Grid**: You should now see a "Category" column
3. **Assign Categories**: 
   - Click "Edit" on any product
   - Select a category from the dropdown
   - Save and verify it appears in the grid

## 🐛 Troubleshooting

### Issue: "Unknown column 'c.id' in join clause"
**Solution**: Verify the categories table was created successfully:
```sql
\dt categories  -- or SHOW TABLES LIKE 'categories';
```

### Issue: Categories dropdown empty when editing product
**Solution**: Check if categories were inserted:
```sql
SELECT * FROM categories;
```

### Issue: Still not showing after migration
**Solution**: 
1. Clear your browser cache (Ctrl+Shift+Delete)
2. Restart both backend and frontend servers
3. Check browser console for any error messages

### Issue: "Duplicate key value violates unique constraint"
**Solution**: This means categories already exist, which is fine. The `ON CONFLICT` clause handles this.

## 📋 Database Schema Check

To verify the complete schema setup, run:

```sql
-- Check products table structure
\d products

-- Check categories table structure  
\d categories

-- Check the foreign key relationship
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name IN ('products', 'categories');
```

## 🔄 Alternative: Using File Migration

If you have database management tools, you can also:

1. Open `backend/MIGRATION_ADD_CATEGORIES.sql`
2. Run it directly from your PostgreSQL client (pgAdmin, DBeaver, etc.)
3. Or execute via command line:
   ```bash
   psql -U <user> -d <database> -f backend/MIGRATION_ADD_CATEGORIES.sql
   ```

## ✨ After Successful Setup

Once the migration is complete:

1. **Backend**: Product listing shows category names
2. **Admin Product Form**: Category dropdown works
3. **Frontend Products Page**: Category dropdown filter active
4. **Frontend Home Page**: Category showcase sections display

## 📞 Still Having Issues?

Check these things:
- [ ] PostgreSQL service is running
- [ ] Database credentials are correct
- [ ] No error messages in backend console
- [ ] Browser DevTools shows no CORS or API errors
- [ ] Backend has been restarted after migration
- [ ] Categories have been assigned to at least one product

---

**Note**: The backend now has fallback logic - if the migration hasn't been run, it will still work but categories won't display. Once you run this migration, everything will work perfectly!
