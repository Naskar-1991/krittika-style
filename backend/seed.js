/**
 * Seed script — inserts saree categories + dummy products
 * Run:  node seed.js
 */

require("dotenv").config();
const pool = require("./db");

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Silk Sarees",      slug: "silk-sarees",      description: "Pure silk weaves from the finest looms of India", display_order: 1 },
  { name: "Cotton Sarees",    slug: "cotton-sarees",    description: "Breathable everyday cotton weaves from Bengal and beyond", display_order: 2 },
  { name: "Banarasi",         slug: "banarasi",         description: "Opulent Banarasi silk sarees with intricate zari work", display_order: 3 },
  { name: "Kanjivaram",       slug: "kanjivaram",       description: "The queen of silks — heavy temple-border Kanjivaram weaves", display_order: 4 },
  { name: "Handloom",         slug: "handloom",         description: "Hand-woven sarees crafted by master artisans", display_order: 5 },
  { name: "Bridal",           slug: "bridal",           description: "Exquisite bridal sarees for your most special day", display_order: 6 },
  { name: "Festive",          slug: "festive",          description: "Vibrant festive sarees for puja, celebrations and weddings", display_order: 7 },
  { name: "Printed Sarees",   slug: "printed-sarees",   description: "Beautiful block-print, digital-print and batik sarees", display_order: 8 },
  { name: "Georgette",        slug: "georgette",        description: "Light, flowing georgette sarees ideal for any occasion", display_order: 9 },
  { name: "Linen Sarees",     slug: "linen-sarees",     description: "Crisp, breathable linen sarees for the modern woman", display_order: 10 },
];

// ─── Products per category (5 each) ──────────────────────────────────────────
const PRODUCTS_BY_CATEGORY = {
  "Silk Sarees": [
    { name: "Royal Mysore Silk – Deep Magenta", price: 8500,  original_price: 11000, stock: 15, description: "Pure Mysore silk with a lustrous finish. Gold zari border with peacock motifs. Certificate of authenticity included." },
    { name: "Kanchipuram Pure Silk – Peacock Blue", price: 12500, original_price: 16000, stock: 8,  description: "Authentic Kanchipuram silk with contrasting borders. Rich navy body with peacock-blue pallav embroidered in gold." },
    { name: "Tussar Silk – Earthy Beige", price: 4200,  original_price: 5800,  stock: 20, description: "Natural tussar silk with hand-painted tribal motifs. Lightweight and perfect for summer festivals." },
    { name: "Banglori Silk – Emerald Green", price: 3800,  original_price: 5000,  stock: 25, description: "Soft Banglori silk with delicate floral prints. Machine washable and easy to drape." },
    { name: "Chanderi Silk – Ivory with Gold", price: 6200,  original_price: 8000,  stock: 12, description: "Semi-transparent Chanderi silk with fine golden buti work. Elegant enough for corporate events, festive enough for celebrations." },
  ],
  "Cotton Sarees": [
    { name: "Tant Cotton – Cobalt Blue", price: 1200,  original_price: 1800,  stock: 40, description: "Traditional Bengal tant saree with crisp texture and vivid cobalt body. Ideal for everyday wear." },
    { name: "Jamdani Cotton – Off White", price: 3500,  original_price: 4800,  stock: 18, description: "UNESCO heritage Jamdani weave with intricate floral motifs woven directly into the fabric. Heirloom quality." },
    { name: "Sambalpuri Cotton – Red & Black", price: 2200,  original_price: 3000,  stock: 22, description: "Ikat-dyed cotton saree from Odisha. Bold geometric patterns in striking red and black." },
    { name: "Kerala Kasavu – Pure White", price: 1800,  original_price: 2400,  stock: 35, description: "Classic Kerala cotton with traditional golden kasavu border. Perfect for Onam, temple visits and formal occasions." },
    { name: "Handspun Cotton – Indigo Stripe", price: 1500,  original_price: 2000,  stock: 30, description: "Hand-spun, hand-woven cotton with natural indigo stripes. Eco-friendly and hypoallergenic." },
  ],
  "Banarasi": [
    { name: "Banarasi Pure Katan Silk – Crimson", price: 18000, original_price: 24000, stock: 6,  description: "Pure katan silk with heavy zari jaal work. Traditional Banarasi motifs of paisleys and flowers. Wedding essential." },
    { name: "Banarasi Organza – Pastel Pink", price: 9500,  original_price: 13000, stock: 10, description: "Light organza base with delicate Banarasi weaving. Ideal for reception and cocktail functions." },
    { name: "Banarasi Georgette – Royal Blue", price: 7200,  original_price: 9500,  stock: 14, description: "Soft georgette with fine Banarasi brocade work. Easy to drape and manage throughout the day." },
    { name: "Banarasi Shattir – Teal Gold", price: 22000, original_price: 28000, stock: 4,  description: "Rare shattir technique Banarasi saree with contrasting gold and silver zari. Collector's piece." },
    { name: "Banarasi Tussar – Antique Gold", price: 11000, original_price: 14500, stock: 9,  description: "Tussar silk base with Banarasi brocade in antique gold. The perfect fusion of two traditions." },
  ],
  "Kanjivaram": [
    { name: "Classic Kanjivaram – Ruby Red", price: 24000, original_price: 32000, stock: 5,  description: "100% mulberry silk with traditional temple border and elephant motifs. Pure zari with silver and gold." },
    { name: "Kanjivaram – Bottle Green & Gold", price: 19500, original_price: 26000, stock: 7,  description: "Deep bottle green with contrasting gold border. Bridal-grade zari work. GI-tagged authentic weave." },
    { name: "Kanjivaram Tissue – Champagne", price: 15000, original_price: 20000, stock: 10, description: "Lightweight tissue Kanjivaram with subtle shimmer. Perfect for day events and receptions." },
    { name: "Kanjivaram – Dual Shade Blue", price: 28000, original_price: 36000, stock: 3,  description: "Premium dual-shade Kanjivaram — the body shifts from cobalt to violet in different light. Exclusive collector's piece." },
    { name: "Kanjivaram – Mustard & Maroon", price: 21000, original_price: 27000, stock: 6,  description: "Vibrant mustard body with a rich maroon border and traditional Mayil (peacock) pallav motifs." },
  ],
  "Handloom": [
    { name: "Pochampally Ikat – Geometric Blue", price: 3200,  original_price: 4500,  stock: 20, description: "Telangana's famous double-ikat weave. Geometric blue patterns that are unique to each saree." },
    { name: "Mangalagiri Cotton – Peach", price: 1800,  original_price: 2500,  stock: 28, description: "Light, crisp Mangalagiri weave from Andhra Pradesh. Peach body with silver border. Perfect for summer." },
    { name: "Dhaniakhali Tant – Mauve", price: 1400,  original_price: 1900,  stock: 35, description: "Fine Bengal handloom weave in soft mauve with traditional red border. Everyday elegance." },
    { name: "Gadwal Silk-Cotton – Burgundy", price: 5500,  original_price: 7500,  stock: 12, description: "Unique Gadwal weave — cotton body with pure silk pallav and border. Best of both worlds." },
    { name: "Chendamangalam – Cream & Gold", price: 4200,  original_price: 5800,  stock: 15, description: "Kerala's rare Chendamangalam weave with fine kasavu motifs. GI-tagged handloom." },
  ],
  "Bridal": [
    { name: "Bridal Kanjivaram – Deep Red & Gold", price: 45000, original_price: 58000, stock: 3,  description: "The quintessential South Indian bridal saree. Double-warp pure silk with heavy 24-carat gold zari. Heirloom piece." },
    { name: "Bridal Banarasi – Ivory & Rose Gold", price: 38000, original_price: 48000, stock: 4,  description: "Ivory katan silk with rose-gold zari work. Intricate floral jaal and peacock border. North Indian bridal favourite." },
    { name: "Bridal Lehenga Saree – Blush Pink", price: 28000, original_price: 36000, stock: 6,  description: "Pre-stitched lehenga-style saree with heavy embroidery and stonework. Easy to drape, stunning to wear." },
    { name: "Embroidered Bridal – Scarlet Red", price: 32000, original_price: 42000, stock: 5,  description: "Heavy hand-embroidered saree with zardozi and sequin work. Comes with a matching hand-embroidered blouse piece." },
    { name: "Bridal Paithani – Peacock Green", price: 35000, original_price: 45000, stock: 3,  description: "Maharashtra's legendary Paithani silk with peacock and lotus motifs woven in pure gold zari. UNESCO craft heritage." },
  ],
  "Festive": [
    { name: "Festive Silk – Saffron & Gold", price: 5500,  original_price: 7500,  stock: 18, description: "Vibrant saffron silk with gold zari border. Ideal for Navratri, Diwali and puja occasions." },
    { name: "Patola – Rainbow Geometric", price: 12000, original_price: 16000, stock: 8,  description: "Patan Patola-inspired double-ikat with vibrant geometric patterns. A festive showstopper." },
    { name: "Festive Bandhani – Multicolour", price: 3800,  original_price: 5200,  stock: 22, description: "Traditional Gujarati bandhani tie-dye in a burst of festive colours. Light and comfortable for long celebrations." },
    { name: "Kalamkari – Temple Motif", price: 4500,  original_price: 6000,  stock: 16, description: "Hand-painted kalamkari with temple deities and floral patterns. Each saree is a unique work of art." },
    { name: "Festive Organza – Gold Shimmer", price: 7800,  original_price: 10000, stock: 12, description: "Shimmery organza with woven gold motifs throughout. Perfect for evening functions and weddings." },
  ],
  "Printed Sarees": [
    { name: "Block Print Cotton – Indigo Floral", price: 1800,  original_price: 2500,  stock: 30, description: "Hand block-printed cotton with traditional Rajasthani floral motifs. Natural indigo dye." },
    { name: "Digital Print Georgette – Tropical", price: 2200,  original_price: 3000,  stock: 25, description: "Vibrant tropical floral digital print on soft georgette. Modern and easy to drape." },
    { name: "Batik Silk – Abstract Brown", price: 4500,  original_price: 6000,  stock: 14, description: "Hand-batik wax-resist print on silk. Unique abstract patterns in earthy brown tones." },
    { name: "Ajrakh Print Cotton – Geometric", price: 2800,  original_price: 3800,  stock: 20, description: "Traditional Ajrakh block print from Kutch. Geometric patterns in natural rust and black." },
    { name: "Floral Linen Print – Pastel Mix", price: 3200,  original_price: 4200,  stock: 18, description: "Large floral print on breathable linen. Soft pastels — perfect for brunch and day events." },
  ],
  "Georgette": [
    { name: "Plain Georgette – Navy Blue", price: 1500,  original_price: 2000,  stock: 40, description: "Pure georgette in rich navy. Lightweight, flowy and ideal for office or evening wear. Easy to drape." },
    { name: "Embroidered Georgette – Mauve", price: 3800,  original_price: 5200,  stock: 18, description: "Soft mauve georgette with thread and sequin embroidery on the border and pallav." },
    { name: "Georgette with Satin Border – Black", price: 2500,  original_price: 3400,  stock: 22, description: "Classic black georgette with a contrasting satin border. Versatile — wears from office to evening." },
    { name: "Chiffon Georgette – Rose Gold", price: 4200,  original_price: 5800,  stock: 15, description: "Rose-gold chiffon-georgette blend with subtle shimmer. Perfect for cocktail events." },
    { name: "Georgette Bandhani – Coral", price: 2800,  original_price: 3800,  stock: 20, description: "Coral georgette with fine bandhani dots. Festive yet light enough for the whole day." },
  ],
  "Linen Sarees": [
    { name: "Pure Linen – Slate Grey", price: 2800,  original_price: 3800,  stock: 25, description: "100% pure linen in sophisticated slate grey. Crisp drape, hypoallergenic and eco-friendly." },
    { name: "Linen Silk Blend – Olive Green", price: 4500,  original_price: 6000,  stock: 16, description: "50:50 linen-silk blend in olive green. Gets the lightness of linen and sheen of silk." },
    { name: "Linen Jamdani – Off White", price: 5800,  original_price: 7500,  stock: 10, description: "Rare linen jamdani with hand-woven floral motifs. Where heritage meets modern sensibility." },
    { name: "Bhagalpuri Linen – Terracotta", price: 3200,  original_price: 4400,  stock: 20, description: "Bhagalpur's famous linen with natural terracotta tones. Handwoven and naturally dyed." },
    { name: "Linen Stripe – Navy & White", price: 2200,  original_price: 3000,  stock: 30, description: "Clean navy and white stripe linen saree. Smart, crisp and perfect for the workplace." },
  ],
};

// ─── Placeholder image URLs (royalty-free saree-like images) ─────────────────
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
  "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600",
  "https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=600",
  "https://images.unsplash.com/photo-1619463071035-255eb76a4e04?w=600",
  "https://images.unsplash.com/photo-1617627143233-5b44df326f04?w=600",
  "https://images.unsplash.com/photo-1564294260685-a0abe8d83f7f?w=600",
  "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600",
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600",
  "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=600",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
];

function randomImage() {
  return PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
}

// ─── Main seed function ───────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("🌱 Starting seed...\n");

    // Insert categories (skip if slug already exists)
    const categoryIdMap = {};

    for (const cat of CATEGORIES) {
      const existing = await client.query(
        "SELECT id FROM categories WHERE slug = $1",
        [cat.slug]
      );

      let catId;
      if (existing.rows.length > 0) {
        catId = existing.rows[0].id;
        console.log(`  ⏭  Category already exists: ${cat.name} (id=${catId})`);
      } else {
        const res = await client.query(
          `INSERT INTO categories (name, slug, description, display_order, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, true, NOW(), NOW()) RETURNING id`,
          [cat.name, cat.slug, cat.description, cat.display_order]
        );
        catId = res.rows[0].id;
        console.log(`  ✅ Inserted category: ${cat.name} (id=${catId})`);
      }

      categoryIdMap[cat.name] = catId;
    }

    console.log("");

    // Insert products
    let productCount = 0;
    for (const [catName, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
      const catId = categoryIdMap[catName];
      if (!catId) {
        console.warn(`  ⚠️  No category id found for "${catName}", skipping`);
        continue;
      }

      for (const p of products) {
        // Skip if product with same name already exists in this category
        const existing = await client.query(
          "SELECT id FROM products WHERE name = $1 AND category_id = $2",
          [p.name, catId]
        );

        if (existing.rows.length > 0) {
          console.log(`  ⏭  Product already exists: ${p.name}`);
          continue;
        }

        const prodRes = await client.query(
          `INSERT INTO products (name, price, original_price, description, stock, category_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
          [p.name, p.price, p.original_price, p.description, p.stock, catId]
        );
        const productId = prodRes.rows[0].id;

        // Insert 2 placeholder images per product
        const img1 = randomImage();
        const img2 = randomImage();
        await client.query(
          `INSERT INTO product_images (product_id, image_url, display_order, is_primary)
           VALUES ($1, $2, 0, true), ($1, $3, 1, false)`,
          [productId, img1, img2]
        );

        console.log(`  ✅ ${catName} → ${p.name} (₹${p.price})`);
        productCount++;
      }
    }

    await client.query("COMMIT");
    console.log(`\n🎉 Seed complete! Inserted ${productCount} products across ${CATEGORIES.length} categories.\n`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Seed failed, rolled back:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
