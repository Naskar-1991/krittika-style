const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecret";

// Middleware to verify JWT token
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

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    
    const user = result.rows[0];
    if (user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
    
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all active categories (public)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE is_active=TRUE ORDER BY display_order ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all categories including inactive (admin only)
router.get("/all", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY display_order ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single category by ID (public)
router.get("/id/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE id=$1 AND is_active=TRUE",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Category not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get category by slug (public)
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE slug=$1 AND is_active=TRUE",
      [slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Category not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new category (admin only)
router.post("/", authenticateToken, verifyAdmin, async (req, res) => {
  const { name, slug, description, image_url, display_order } = req.body;
  
  if (!name || !slug) {
    return res.status(400).json({ error: "Name and slug are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO categories (name, slug, description, image_url, display_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
      [name, slug, description || null, image_url || null, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Category with this name or slug already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update category (admin only)
router.put("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, image_url, display_order, is_active } = req.body;

  try {
    const result = await pool.query(
      "UPDATE categories SET name=$1, slug=$2, description=$3, image_url=$4, display_order=$5, is_active=$6, updated_at=NOW() WHERE id=$7 RETURNING *",
      [name, slug, description || null, image_url || null, display_order || 0, is_active !== undefined ? is_active : true, id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Category not found" });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Category with this name or slug already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Delete category (admin only)
router.delete("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM categories WHERE id=$1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted successfully", category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
