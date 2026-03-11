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
const dotenv = require('dotenv')
dotenv.config();
const app = express();
app.use(cors());
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
console.log(process.env.DB_HOST, process.env.DB_USER, process.env.DB_NAME)
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
