const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { notifyOrderConfirmed } = require("../notificationService");

const SECRET = process.env.JWT_SECRET || "supersecret";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "your_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "your_key_secret",
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Create Razorpay Order
router.post("/create-order", authenticateToken, async (req, res) => {
  try {
    const { orderId, amount, email, phoneNumber } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ error: "Order ID and amount are required" });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Amount in paise (smallest unit)
      currency: "INR",
      receipt: `order_${orderId}`,
      notes: {
        orderId: orderId,
        userId: req.user.id,
        email: email,
      },
    });

    // Store Razorpay order ID in database
    const updateResult = await pool.query(
      `UPDATE orders 
       SET razorpay_order_id = $1, payment_status = 'pending' 
       WHERE id = $2 AND user_id = $3
       RETURNING id, razorpay_order_id, total_amount`,
      [razorpayOrder.id, orderId, req.user.id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      email: email,
      phoneNumber: phoneNumber,
      orderId: orderId,
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify Payment
router.post("/verify-payment", authenticateToken, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } =
      req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Payment details are required" });
    }

    // Verify signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "your_key_secret")
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    // Update order status in database
    const updateResult = await pool.query(
      `UPDATE orders 
       SET payment_status = 'completed',
           razorpay_payment_id = $1,
           razorpay_signature = $2,
           payment_method = $3,
           payment_date = NOW(),
           payment_amount = $4,
           status = 'processing'
       WHERE id = $5 AND user_id = $6
       RETURNING id, payment_status, razorpay_order_id, razorpay_payment_id`,
      [
        razorpayPaymentId,
        razorpaySignature,
        payment.method || "unknown",
        payment.amount / 100, // Convert from paise to rupees
        orderId,
        req.user.id,
      ]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Send order confirmation notifications (fire-and-forget — never block the response)
    try {
      const [userResult, itemsResult] = await Promise.all([
        pool.query("SELECT id, name, email, phone FROM users WHERE id=$1", [req.user.id]),
        pool.query(
          `SELECT oi.quantity, oi.price, p.name
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id=$1`,
          [orderId]
        ),
      ]);

      if (userResult.rows.length > 0) {
        notifyOrderConfirmed({
          order: { id: orderId, total_amount: payment.amount / 100 },
          user: userResult.rows[0],
          items: itemsResult.rows,
        }).catch((e) => console.error("[Notify] Confirmation error:", e.message));
      }
    } catch (notifyErr) {
      console.error("[Notify] Failed to fetch data for confirmation:", notifyErr.message);
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: updateResult.rows[0],
    });
  } catch (err) {
    console.error("Error verifying payment:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get Payment Status
router.get("/status/:orderId", authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(
      `SELECT id, payment_status, razorpay_order_id, razorpay_payment_id, 
              payment_method, payment_date, total_amount, status
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [orderId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dummy payment for testing — marks order as paid without going through Razorpay
router.post("/dummy-payment", authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const result = await pool.query(
      `UPDATE orders
       SET payment_status = 'completed',
           payment_method = 'dummy',
           payment_date = NOW(),
           status = 'processing'
       WHERE id = $1 AND user_id = $2
       RETURNING id, payment_status, status`,
      [orderId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    console.error("Dummy payment error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Handle payment failure
router.post("/handle-failure", authenticateToken, async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    const updateResult = await pool.query(
      `UPDATE orders 
       SET payment_status = 'failed' 
       WHERE id = $1 AND user_id = $2
       RETURNING id, payment_status`,
      [orderId, req.user.id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      success: true,
      message: "Order marked as payment failed",
      order: updateResult.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
