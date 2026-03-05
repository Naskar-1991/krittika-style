/**
 * Database Migration Helper
 * Run this script to automatically set up the categories table and schema
 * 
 * Usage: node setup-categories.js
 */

require("dotenv").config();
const pool = require("./db");

async function setupCategories() {
  const client = await pool.connect();
  
  try {
    console.log("🔄 Starting database setup for categories...\n");

    // 1. Create categories table
    console.log("📋 Creating categories table...");
    await client.query(`
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
      )
    `);
    console.log("✅ Categories table created/verified\n");

    // 2. Add category_id column to products
    console.log("📋 Adding category_id column to products table...");
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER
    `);
    console.log("✅ Column added/verified\n");

    // 3. Add foreign key constraint
    console.log("📋 Adding foreign key constraint...");
    try {
      await client.query(`
        ALTER TABLE products 
        ADD CONSTRAINT fk_product_category 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      `);
      console.log("✅ Foreign key constraint added\n");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("✅ Foreign key constraint already exists\n");
      } else {
        throw err;
      }
    }

    // 4. Create indexes
    console.log("📋 Creating indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)
    `);
    console.log("✅ Indexes created/verified\n");

    // 5. Insert default categories
    console.log("📋 Inserting default categories...");
    await client.query(`
      INSERT INTO categories (name, slug, description, display_order, is_active) 
      VALUES 
        ('Electronics', 'electronics', 'Electronic devices and gadgets', 1, TRUE),
        ('Fashion', 'fashion', 'Clothing and fashion accessories', 2, TRUE),
        ('Home & Living', 'home-living', 'Home decor and living essentials', 3, TRUE),
        ('Books & Media', 'books-media', 'Books, movies, and media', 4, TRUE),
        ('Sports & Outdoors', 'sports-outdoors', 'Sports and outdoor equipment', 5, TRUE)
      ON CONFLICT (name) DO NOTHING
    `);
    console.log("✅ Default categories inserted\n");

    // 6. Verify setup
    console.log("📊 Verifying setup...");
    const categoryCount = await client.query(`
      SELECT COUNT(*) as count FROM categories
    `);
    const categoryList = await client.query(`
      SELECT id, name, slug, display_order, is_active FROM categories 
      ORDER BY display_order
    `);
    
    console.log(`✅ Total categories: ${categoryCount.rows[0].count}\n`);
    console.log("📑 Installed categories:");
    categoryList.rows.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.slug}) - ${cat.is_active ? '🟢 Active' : '🔴 Inactive'}`);
    });

    console.log("\n✨ Database setup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Restart your backend server");
    console.log("   2. Go to Admin → Products");
    console.log("   3. Edit or create a product to assign a category");
    console.log("   4. Category should now display in the product grid");

  } catch (err) {
    console.error("❌ Error during setup:", err.message);
    console.error("\nFull error details:", err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

// Run setup
console.log("🚀 Category Database Setup\n");
console.log("================================\n");

setupCategories().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
