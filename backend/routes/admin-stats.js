const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecret";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT role FROM users WHERE id=$1", [req.user.id]);
    if (!result.rows.length || result.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/stats — dashboard summary
router.get("/", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const [
      ordersStats,
      productStats,
      userStats,
      topProducts,
      recentOrders,
      revenueByMonth,
    ] = await Promise.all([
      // Total orders + revenue
      pool.query(`
        SELECT
          COUNT(*) AS total_orders,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
          COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_orders,
          COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
          COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) AS total_revenue,
          COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND status != 'cancelled'), 0) AS revenue_last_30d
        FROM orders
      `),

      // Products summary
      pool.query(`
        SELECT
          COUNT(*) AS total_products,
          COUNT(*) FILTER (WHERE stock = 0) AS out_of_stock,
          COUNT(*) FILTER (WHERE stock > 0 AND stock <= 5) AS low_stock
        FROM products
      `),

      // Users summary
      pool.query(`
        SELECT
          COUNT(*) AS total_users,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_last_30d
        FROM users
        WHERE signup_complete = true OR signup_complete IS NULL
      `),

      // Top 5 selling products
      pool.query(`
        SELECT
          p.id,
          p.name,
          p.price,
          COALESCE(SUM(oi.quantity), 0) AS units_sold,
          COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
        GROUP BY p.id, p.name, p.price
        ORDER BY units_sold DESC
        LIMIT 5
      `),

      // 10 most recent orders
      pool.query(`
        SELECT
          o.id,
          o.total_amount,
          o.status,
          o.created_at,
          u.name AS customer_name,
          u.email AS customer_email
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT 10
      `),

      // Revenue by month (last 6 months)
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
          DATE_TRUNC('month', created_at) AS month_date,
          COUNT(*) AS order_count,
          COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE status != 'cancelled'
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month_date ASC
      `),
    ]);

    res.json({
      orders: ordersStats.rows[0],
      products: productStats.rows[0],
      users: userStats.rows[0],
      topProducts: topProducts.rows,
      recentOrders: recentOrders.rows,
      revenueByMonth: revenueByMonth.rows,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
