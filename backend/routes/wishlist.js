const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

// Get user's wishlist with product details
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT w.id as wishlist_id, w.user_id, w.product_id, w.created_at, 
              p.name, p.price, p.description, p.stock,
              COALESCE(pi.image_url, p.image) as image
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    
    // Log for debugging
    console.log("Wishlist query results:", result.rows);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Wishlist fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add item to wishlist
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    // Check if product exists
    const productCheck = await pool.query(
      "SELECT id FROM products WHERE id = $1",
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Add to wishlist (will fail silently if already exists due to UNIQUE constraint)
    const result = await pool.query(
      `INSERT INTO wishlist (user_id, product_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING *`,
      [userId, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Item already in wishlist" });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove item from wishlist by product_id
router.delete("/:productId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    const result = await pool.query(
      "DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2",
      [userId, productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item not in wishlist" });
    }

    res.json({ message: "Item removed from wishlist" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if product is in user's wishlist
router.get("/check/:productId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    const result = await pool.query(
      "SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2",
      [userId, productId]
    );

    res.json({ isInWishlist: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear entire wishlist
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "DELETE FROM wishlist WHERE user_id = $1",
      [userId]
    );

    res.json({ message: `${result.rowCount} items removed from wishlist` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
