const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
dotenv.config();

const authRoute = require("./routes/auth");
const ordersRoute = require("./routes/orders");
const productsRoute = require("./routes/products");
const categoriesRoute = require("./routes/categories");
const cartRoute = require("./routes/cart");
const usersRoute = require("./routes/users");
const paymentRoute = require("./routes/payment");
const webhooksRoute = require("./routes/webhooks");
const wishlistRoute = require("./routes/wishlist");
const returnsRoute = require("./routes/returns");
const adminReturnsRoute = require("./routes/admin-returns");
const logoRoute = require("./routes/logo");
const reviewsRoute = require("./routes/reviews");
const couponsRoute = require("./routes/coupons");
const adminStatsRoute = require("./routes/admin-stats");

const app = express();

// Trust Vercel's proxy so rate limiter reads the real client IP
app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://dev.krittikastyle.com',
      'https://api.krittikastyle.com',
      'http://localhost:3000',
    ];
    // Allow all Vercel preview/production deployments for this project
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting for auth routes — prevents brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: { error: "Too many requests. Please try again in 15 minutes." },
});

// Stricter limiter for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: { error: "Too many OTP requests. Please wait 10 minutes." },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ensure uploads directory exists
const fs = require("fs");
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// Apply rate limiters to auth routes
app.use("/api/auth", authLimiter);
app.use("/api/auth/signup-initiate", otpLimiter);
app.use("/api/auth/signup-resend-otp", otpLimiter);
app.use("/api/auth/login-initiate", otpLimiter);

// Mount routes
app.use("/api/auth", authRoute);
app.use("/api/products", productsRoute);
app.use("/api/categories", categoriesRoute);
app.use("/api/cart", cartRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/users", usersRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/webhooks", webhooksRoute);
app.use("/api/wishlist", wishlistRoute);
app.use("/api/returns", returnsRoute);
app.use("/api/admin/returns", adminReturnsRoute);
app.use("/api/admin/stats", adminStatsRoute);
app.use("/api/logo", logoRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/coupons", couponsRoute);

// ==================== AUTO MIGRATIONS ====================
const pool = require("./db");
const runMigrations = async () => {
  try {
    // Restore SERIAL sequence on orders.id if it was lost
    await pool.query(`
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
    `);

    // Shiprocket order id column
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id BIGINT
    `);

    // Add user_id to cart table (scopes cart rows to individual users)
    await pool.query(`
      ALTER TABLE cart ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    `);

    // Add created_at to cart if missing
    await pool.query(`
      ALTER TABLE cart ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
    `);

    // Coupons table
    await pool.query(`
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
      )
    `);

    console.log("✅ Migrations applied successfully");
  } catch (err) {
    console.error("⚠️  Migration error:", err.message);
  }
};

// ==================== SHIPROCKET INITIALIZATION ====================
const ShiprocketClient = require("./shiprocketService");
global.shiprocket = new ShiprocketClient();

const initializeShiprocket = async () => {
  try {
    console.log('\n🚀 Initializing Shiprocket Integration...');
    await global.shiprocket.initialize();
    console.log('✅ Shiprocket is ready!');

    try {
      const pickupData = await global.shiprocket.listPickupLocations();
      const locations = pickupData?.data?.shipping_address || [];
      console.log('\n📦 Available Shiprocket Pickup Locations:');
      if (locations.length === 0) {
        console.warn('  ⚠️  No pickup locations found! Add a warehouse in Shiprocket dashboard.');
      } else {
        locations.forEach(loc => console.log(`  ✅ Name: "${loc.pickup_location}" | ID: ${loc.id} | Pincode: ${loc.pin_code}`));
        console.log(`\n  👉 Set SHIPROCKET_PICKUP_LOCATION to one of the names above in your .env\n`);
      }
    } catch (e) {
      console.warn('  ⚠️  Could not fetch pickup locations:', e.message);
    }
  } catch (error) {
    console.error('⚠️  WARNING: Shiprocket initialization failed!');
    console.error('  Error:', error.message);
    console.error('\n  Action: Check SHIPROCKET_EMAIL and SHIPROCKET_API_KEY in .env\n');
  }
};

console.log(process.env.DB_HOST, process.env.DB_USER, process.env.DB_NAME);
if (require.main === module) {
  const PORT = process.env.PORT || 5500;
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    await runMigrations();
    initializeShiprocket();
  });
}

module.exports = app;
