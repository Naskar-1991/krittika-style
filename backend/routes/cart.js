const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecret";

// Middleware to verify JWT token (required for all cart operations)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Please log in to access your cart" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Session expired. Please log in again." });
  }
};

// GET /api/cart — get current user's cart with product details
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        c.id,
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.original_price,
        p.stock,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id AND pi.is_primary = true
          LIMIT 1
        ) AS image_url
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart — add item to cart (or increment quantity if already present)
router.post("/", authenticateToken, async (req, res) => {
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) return res.status(400).json({ error: "product_id is required" });

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1) return res.status(400).json({ error: "quantity must be a positive integer" });

  try {
    // Validate product exists and has enough stock
    const productResult = await pool.query(
      "SELECT id, name, stock FROM products WHERE id = $1",
      [product_id]
    );
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = productResult.rows[0];

    // Check existing cart quantity for this user + product
    const existingResult = await pool.query(
      "SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2",
      [req.user.id, product_id]
    );

    const existingQty = existingResult.rows.length > 0 ? existingResult.rows[0].quantity : 0;
    const newTotalQty = existingQty + qty;

    if (product.stock < newTotalQty) {
      return res.status(400).json({
        error: `Only ${product.stock} units available. You already have ${existingQty} in your cart.`
      });
    }

    let cartRow;
    if (existingResult.rows.length > 0) {
      // Increment quantity
      const updateResult = await pool.query(
        "UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *",
        [newTotalQty, existingResult.rows[0].id]
      );
      cartRow = updateResult.rows[0];
    } else {
      // Insert new row
      const insertResult = await pool.query(
        "INSERT INTO cart (user_id, product_id, quantity, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
        [req.user.id, product_id, qty]
      );
      cartRow = insertResult.rows[0];
    }

    res.json(cartRow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cart/:id — update quantity of a cart item
router.put("/:id", authenticateToken, async (req, res) => {
  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);

  if (isNaN(qty) || qty < 1) return res.status(400).json({ error: "quantity must be a positive integer" });

  try {
    // Ensure this cart item belongs to the requesting user
    const cartResult = await pool.query(
      "SELECT c.id, c.product_id, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = $1 AND c.user_id = $2",
      [req.params.id, req.user.id]
    );

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    const { stock } = cartResult.rows[0];
    if (qty > stock) {
      return res.status(400).json({ error: `Only ${stock} units available` });
    }

    const result = await pool.query(
      "UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [qty, req.params.id, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/:id — remove item from cart
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json({ message: "Item removed from cart" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart — clear the entire cart for the current user
router.delete("/", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM cart WHERE user_id = $1", [req.user.id]);
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
