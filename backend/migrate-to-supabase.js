require('dotenv').config();
const { Pool } = require('pg');

const local = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

const supabase = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log('🔌 Connecting to both databases...');
    await Promise.all([local.query('SELECT 1'), supabase.query('SELECT 1')]);
    console.log('✅ Both connections OK\n');

    // ── Categories ──────────────────────────────────────────────
    console.log('📦 Migrating categories...');
    const { rows: cats } = await local.query('SELECT * FROM categories ORDER BY id');
    if (cats.length) {
      // Clear existing default categories inserted by schema
      await supabase.query('DELETE FROM categories');
      for (const cat of cats) {
        await supabase.query(
          `INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET name=$2,slug=$3,description=$4,image_url=$5,display_order=$6,is_active=$7`,
          [cat.id, cat.name, cat.slug, cat.description, cat.image_url, cat.display_order, cat.is_active, cat.created_at, cat.updated_at]
        );
      }
      // Reset sequence
      await supabase.query(`SELECT setval(pg_get_serial_sequence('categories','id'), MAX(id)) FROM categories`);
      console.log(`  ✅ ${cats.length} categories migrated`);
    } else {
      console.log('  ⚠️  No categories found');
    }

    // ── Products ─────────────────────────────────────────────────
    console.log('\n📦 Migrating products...');
    const { rows: products } = await local.query('SELECT * FROM products ORDER BY id');
    if (products.length) {
      for (const p of products) {
        await supabase.query(
          `INSERT INTO products (id, name, price, image, description, stock, created_at, original_price, category_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET name=$2,price=$3,image=$4,description=$5,stock=$6,original_price=$8,category_id=$9`,
          [p.id, p.name, p.price, p.image, p.description, p.stock, p.created_at, p.original_price, p.category_id]
        );
      }
      await supabase.query(`SELECT setval(pg_get_serial_sequence('products','id'), MAX(id)) FROM products`);
      console.log(`  ✅ ${products.length} products migrated`);
    } else {
      console.log('  ⚠️  No products found');
    }

    // ── Product Images ────────────────────────────────────────────
    console.log('\n📦 Migrating product images...');
    const { rows: images } = await local.query('SELECT * FROM product_images ORDER BY id');
    if (images.length) {
      for (const img of images) {
        await supabase.query(
          `INSERT INTO product_images (id, product_id, image_url, display_order, is_primary, created_at)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (id) DO UPDATE SET product_id=$2,image_url=$3,display_order=$4,is_primary=$5`,
          [img.id, img.product_id, img.image_url, img.display_order, img.is_primary, img.created_at]
        );
      }
      await supabase.query(`SELECT setval(pg_get_serial_sequence('product_images','id'), MAX(id)) FROM product_images`);
      console.log(`  ✅ ${images.length} product images migrated`);
    } else {
      console.log('  ⚠️  No product images found');
    }

    // ── Verify ────────────────────────────────────────────────────
    console.log('\n🔍 Verifying Supabase data...');
    const [vc, vp, vi] = await Promise.all([
      supabase.query('SELECT COUNT(*) FROM categories'),
      supabase.query('SELECT COUNT(*) FROM products'),
      supabase.query('SELECT COUNT(*) FROM product_images'),
    ]);
    console.log(`  Categories:     ${vc.rows[0].count}`);
    console.log(`  Products:       ${vp.rows[0].count}`);
    console.log(`  Product images: ${vi.rows[0].count}`);
    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await Promise.all([local.end(), supabase.end()]);
  }
}

migrate();
