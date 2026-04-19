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

// POST /api/coupons/validate — validate & apply a coupon code (user must be logged in)
// Body: { code, cart_total }
router.post("/validate", authenticateToken, async (req, res) => {
  const { code, cart_total } = req.body;

  if (!code) return res.status(400).json({ error: "Coupon code is required" });
  if (!cart_total || isNaN(cart_total)) return res.status(400).json({ error: "cart_total is required" });

  try {
    const result = await pool.query(
      `SELECT * FROM coupons
       WHERE UPPER(code) = UPPER($1)
         AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired coupon code" });
    }

    const coupon = result.rows[0];
    const total = parseFloat(cart_total);

    // Check minimum order value
    if (coupon.min_order_value && total < parseFloat(coupon.min_order_value)) {
      return res.status(400).json({
        error: `Minimum order value for this coupon is ₹${coupon.min_order_value}`
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = (total * parseFloat(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount) {
        discount = Math.min(discount, parseFloat(coupon.max_discount_amount));
      }
    } else if (coupon.discount_type === "flat") {
      discount = parseFloat(coupon.discount_value);
    }

    discount = Math.min(discount, total); // can't discount more than total
    discount = Math.round(discount * 100) / 100;

    res.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_applied: discount,
      final_total: Math.round((total - discount) * 100) / 100,
      message: coupon.description || `Coupon applied! You save ₹${discount}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coupons/use — mark a coupon as used (called on order placement)
// Body: { code }
router.post("/use", authenticateToken, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Coupon code is required" });

  try {
    await pool.query(
      "UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = UPPER($1)",
      [code]
    );
    res.json({ message: "Coupon usage recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin routes ───────────────────────────────────────────────

// GET /api/coupons — list all coupons
router.get("/", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM coupons ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coupons — create a new coupon
router.post("/", authenticateToken, verifyAdmin, async (req, res) => {
  const {
    code, discount_type, discount_value, min_order_value,
    max_discount_amount, max_uses, expires_at, description
  } = req.body;

  if (!code || !discount_type || !discount_value) {
    return res.status(400).json({ error: "code, discount_type and discount_value are required" });
  }
  if (!["percentage", "flat"].includes(discount_type)) {
    return res.status(400).json({ error: "discount_type must be 'percentage' or 'flat'" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO coupons
        (code, discount_type, discount_value, min_order_value, max_discount_amount, max_uses, expires_at, description, is_active, used_count, created_at)
       VALUES
        (UPPER($1), $2, $3, $4, $5, $6, $7, $8, true, 0, NOW())
       RETURNING *`,
      [code, discount_type, discount_value, min_order_value || null, max_discount_amount || null,
       max_uses || null, expires_at || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message.includes("duplicate key") || err.message.includes("unique")) {
      res.status(400).json({ error: "Coupon code already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// PUT /api/coupons/:id — update a coupon
router.put("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    code, discount_type, discount_value, min_order_value,
    max_discount_amount, max_uses, expires_at, description, is_active
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE coupons SET
        code = COALESCE(UPPER($1), code),
        discount_type = COALESCE($2, discount_type),
        discount_value = COALESCE($3, discount_value),
        min_order_value = $4,
        max_discount_amount = $5,
        max_uses = $6,
        expires_at = $7,
        description = $8,
        is_active = COALESCE($9, is_active)
       WHERE id = $10 RETURNING *`,
      [code, discount_type, discount_value, min_order_value || null, max_discount_amount || null,
       max_uses || null, expires_at || null, description || null,
       is_active !== undefined ? is_active : null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Coupon not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/coupons/:id — delete a coupon
router.delete("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM coupons WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Coupon not found" });
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
