const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get cart items
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cart");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to cart
router.post("/", async (req, res) => {
  const { product_id, quantity } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO cart (product_id, quantity) VALUES ($1, $2) RETURNING *",
      [product_id, quantity]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove item from cart
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM cart WHERE id = $1", [req.params.id]);
    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
