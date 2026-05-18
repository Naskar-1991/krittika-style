const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

const verifyAdmin = async (req, res, next) => {
  try {
    const result = await db.query("SELECT role FROM users WHERE id=$1", [req.user.id]);
    if (!result.rows.length || result.rows[0].role !== "admin")
      return res.status(403).json({ error: "Admin access required" });
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `banner-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) cb(new Error("Only image files are allowed"), false);
    else cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// GET all banners (public — returns only active ones by default)
router.get("/", async (req, res) => {
  try {
    const adminMode = req.query.admin === "true";
    const whereClause = adminMode ? "" : "WHERE is_active = true";
    const result = await db.query(
      `SELECT id, image_url, title, link_url, sort_order, is_active
       FROM banners ${whereClause}
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload a new banner (admin only)
router.post("/upload", authenticateToken, verifyAdmin, upload.single("banner"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No banner image provided" });

    const imageUrl = `/uploads/${req.file.filename}`;
    const { title = "", link_url = "" } = req.body;

    const countResult = await db.query(
      "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM banners"
    );
    const sortOrder = countResult.rows[0].next_order;

    const result = await db.query(
      `INSERT INTO banners (image_url, title, link_url, sort_order, is_active)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [imageUrl, title, link_url, sortOrder]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH reorder banners (admin only)
router.patch("/reorder", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ error: "order must be an array" });

    for (const item of order) {
      await db.query("UPDATE banners SET sort_order = $1 WHERE id = $2", [item.sort_order, item.id]);
    }

    res.json({ message: "Order saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle active state (admin only)
router.patch("/:id/toggle", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "UPDATE banners SET is_active = NOT is_active WHERE id = $1 RETURNING *",
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Banner not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a banner (admin only)
router.delete("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT image_url FROM banners WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Banner not found" });

    const imageUrl = result.rows[0].image_url;
    if (imageUrl && imageUrl.startsWith("/uploads/")) {
      const filename = imageUrl.split("/").pop();
      const filePath = path.join(__dirname, "../uploads", filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query("DELETE FROM banners WHERE id = $1", [id]);
    res.json({ message: "Banner deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
