const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + Date.now() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'), false);
    } else {
      cb(null, true);
    }
  }
});


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

// Get all products (public)
router.get("/", async (req, res) => {
  try {
    // Try to fetch with category name
    let result;
    try {
      result = await pool.query(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         ORDER BY p.created_at DESC`
      );
    } catch (joinError) {
      // Fallback if categories table doesn't exist
      console.log("Categories table not found, fetching products without categories");
      result = await pool.query(
        "SELECT * FROM products ORDER BY created_at DESC"
      );
    }
    
    // Fetch images for each product
    const productsWithImages = await Promise.all(
      result.rows.map(async (product) => {
        const imagesResult = await pool.query(
          "SELECT id, image_url, is_primary FROM product_images WHERE product_id=$1 ORDER BY display_order ASC",
          [product.id]
        );
        return {
          ...product,
          images: imagesResult.rows,
          category_name: product.category_name || null  // Ensure category_name exists
        };
      })
    );
    
    res.json(productsWithImages);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get single product by ID (public) with all images
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Try to fetch with category name
    let result;
    try {
      result = await pool.query(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id=$1`,
        [id]
      );
    } catch (joinError) {
      // Fallback if categories table doesn't exist
      result = await pool.query(
        "SELECT * FROM products WHERE id=$1",
        [id]
      );
    }
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    
    const product = result.rows[0];
    
    // Fetch all images for this product
    const imagesResult = await pool.query(
      "SELECT id, image_url, is_primary FROM product_images WHERE product_id=$1 ORDER BY display_order ASC",
      [id]
    );
    
    res.json({
      ...product,
      images: imagesResult.rows,
      category_name: product.category_name || null  // Ensure category_name exists
    });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add new product (admin only) with multiple file uploads
router.post("/", authenticateToken, verifyAdmin, upload.array('images', 10), async (req, res) => {
  req.body = req.body || {};
  const { name, price, description, stock, original_price, category_id } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ error: "Name and price are required" });
  }

  try {
    // Insert product
    const productResult = await pool.query(
      "INSERT INTO products (name, price, original_price, description, stock, category_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *",
      [name, price, original_price || null, description || null, stock || 0, category_id || null]
    );
    
    const productId = productResult.rows[0].id;
    
    // Insert multiple images if provided
    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        const isFirst = i === 0;
        
        const imageResult = await pool.query(
          "INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES ($1, $2, $3, $4) RETURNING *",
          [productId, imageUrl, i, isFirst]
        );
        
        images.push(imageResult.rows[0]);
      }
    }
    
    res.status(201).json({
      ...productResult.rows[0],
      images
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product (admin only) with optional multiple image uploads
router.put("/:id", authenticateToken, verifyAdmin, upload.array('images', 10), async (req, res) => {
  req.body = req.body || {};
  const { id } = req.params;
  const { name, price, description, stock, original_price, removeImageIds, category_id } = req.body;

  try {
    // Update product info
    const result = await pool.query(
      "UPDATE products SET name=$1, price=$2, original_price=$3, description=$4, stock=$5, category_id=$6 WHERE id=$7 RETURNING *",
      [name || null, price || null, original_price || null, description || null, stock || 0, category_id || null, id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    
    const product = result.rows[0];
    
    // Remove specified images
    if (removeImageIds) {
      const idsArray = Array.isArray(removeImageIds) ? removeImageIds : [removeImageIds];
      await pool.query(
        "DELETE FROM product_images WHERE product_id=$1 AND id = ANY($2::int[])",
        [id, idsArray]
      );
    }
    
    // Add new images
    let newImages = [];
    if (req.files && req.files.length > 0) {
      // Get the current max order
      const maxOrderResult = await pool.query(
        "SELECT COALESCE(MAX(display_order), -1) as max_order FROM product_images WHERE product_id=$1",
        [id]
      );
      let nextOrder = maxOrderResult.rows[0].max_order + 1;
      
      for (const file of req.files) {
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        
        const imageResult = await pool.query(
          "INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES ($1, $2, $3, $4) RETURNING *",
          [id, imageUrl, nextOrder, false]
        );
        
        newImages.push(imageResult.rows[0]);
        nextOrder++;
      }
    }
    
    // Fetch all images for this product
    const imagesResult = await pool.query(
      "SELECT id, image_url, is_primary FROM product_images WHERE product_id=$1 ORDER BY display_order ASC",
      [id]
    );
    
    res.json({
      ...product,
      images: imagesResult.rows,
      newImagesAdded: newImages.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product (admin only)
router.delete("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM products WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully", product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a specific product image (admin only)
router.delete("/:productId/images/:imageId", authenticateToken, verifyAdmin, async (req, res) => {
  const { productId, imageId } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM product_images WHERE id=$1 AND product_id=$2 RETURNING *",
      [imageId, productId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Image not found" });
    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set primary image for product (admin only)
router.put("/:productId/images/:imageId/primary", authenticateToken, verifyAdmin, async (req, res) => {
  const { productId, imageId } = req.params;

  try {
    // Remove primary from all images of this product
    await pool.query(
      "UPDATE product_images SET is_primary=FALSE WHERE product_id=$1",
      [productId]
    );
    
    // Set the specified image as primary
    const result = await pool.query(
      "UPDATE product_images SET is_primary=TRUE WHERE id=$1 AND product_id=$2 RETURNING *",
      [imageId, productId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Image not found" });
    res.json({ message: "Primary image updated", image: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
