const express = require("express");
const cors = require("cors");
const path = require("path");
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
const dotenv = require('dotenv')
dotenv.config();
const app = express();
app.use(cors({
  origin: 'https://dev.krittikastyle.com', methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, allowedHeaders: ['Content-Type', 'Authorization']
}));
// app.use(cors({
//   origin: 'http://localhost:3000', methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true, allowedHeaders: ['Content-Type', 'Authorization']
// }));


// allow JSON payloads and urlencoded for form submissions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ensure uploads directory exists
const fs = require("fs");
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
// serve uploaded files statically
app.use("/uploads", express.static(uploadDir));
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
app.use("/api/logo", logoRoute);
app.use("/api/reviews", reviewsRoute);

// ==================== SHIPROCKET INITIALIZATION ====================
const ShiprocketClient = require("./shiprocketService");
global.shiprocket = new ShiprocketClient();

// Initialize Shiprocket on server startup
const initializeShiprocket = async () => {
  try {
    console.log('\n🚀 Initializing Shiprocket Integration...');
    await global.shiprocket.initialize();
    console.log('✅ Shiprocket is ready!\n');
  } catch (error) {
    console.error('⚠️  WARNING: Shiprocket initialization failed!');
    console.error('  This will cause shipping operations to fail.');
    console.error('  Error:', error.message);
    console.error('\n  Action: Check your environment variables:');
    console.error('  - SHIPROCKET_EMAIL');
    console.error('  - SHIPROCKET_API_KEY\n');
  }
};

console.log(process.env.DB_HOST, process.env.DB_USER, process.env.DB_NAME)
const PORT = process.env.PORT || 5500;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  // Initialize Shiprocket after server starts
  initializeShiprocket();
});
