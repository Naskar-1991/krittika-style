const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  try {
    const result = await db.query(
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

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = "logo";
    cb(null, `${basename}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow only image files
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET - Fetch current logo
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT id, logo_url, logo_alt_text, site_name FROM site_settings ORDER BY id DESC LIMIT 1");
    
    if (result.rows.length === 0) {
      return res.json({ id: null, logo_url: null, logo_alt_text: "Logo", site_name: "Krittika Style" });
    }

    const setting = result.rows[0];
    res.json({
      id: setting.id,
      logo_url: setting.logo_url,
      logo_alt_text: setting.logo_alt_text || "Logo",
      site_name: setting.site_name
    });
  } catch (error) {
    console.error("Error fetching logo:", error);
    res.status(500).json({ error: "Failed to fetch logo" });
  }
});

// POST - Upload or update logo (Admin only)
router.post("/upload", authenticateToken, verifyAdmin, upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No logo file provided" });
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    const altText = req.body.altText || "Logo";

    // Check if settings exist
    const existing = await db.query("SELECT id FROM site_settings LIMIT 1");

    let result;
    if (existing.rows.length === 0) {
      // Insert new settings
      result = await db.query(
        "INSERT INTO site_settings (logo_url, logo_alt_text, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id, logo_url, logo_alt_text",
        [logoUrl, altText]
      );
    } else {
      // Update existing settings
      // Delete old logo file if it exists
      const oldSettings = await db.query("SELECT logo_url FROM site_settings LIMIT 1");
      if (oldSettings.rows[0].logo_url) {
        const oldFilename = oldSettings.rows[0].logo_url.split("/").pop();
        const oldPath = path.join(__dirname, "../uploads", oldFilename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      result = await db.query(
        "UPDATE site_settings SET logo_url = $1, logo_alt_text = $2, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM site_settings LIMIT 1) RETURNING id, logo_url, logo_alt_text",
        [logoUrl, altText]
      );
    }

    res.status(201).json({
      message: "Logo uploaded successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    res.status(500).json({ error: "Failed to upload logo" });
  }
});

// DELETE - Delete logo (Admin only)
router.delete("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query("SELECT logo_url FROM site_settings WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Logo not found" });
    }

    const logoUrl = result.rows[0].logo_url;
    
    // Delete file if it exists
    if (logoUrl) {
      const filename = logoUrl.split("/").pop();
      const filePath = path.join(__dirname, "../uploads", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update database to remove logo
    await db.query(
      "UPDATE site_settings SET logo_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    res.json({ message: "Logo deleted successfully" });
  } catch (error) {
    console.error("Error deleting logo:", error);
    res.status(500).json({ error: "Failed to delete logo" });
  }
});

module.exports = router;
