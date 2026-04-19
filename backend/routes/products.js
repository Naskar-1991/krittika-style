const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) cb(new Error("Only image files are allowed"), false);
    else cb(null, true);
  },
});

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
    if (!result.rows.length || result.rows[0].role !== "admin")
      return res.status(403).json({ error: "Admin access required" });
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Build shared WHERE clause ────────────────────────────────────────────────
function buildWhere(query) {
  const { search, category, minPrice, maxPrice } = query;
  const conditions = [];
  const values = [];
  let idx = 1;

  if (search) {
    conditions.push(
      `(p.name ILIKE $${idx} OR p.description ILIKE $${idx} OR c.name ILIKE $${idx})`
    );
    values.push(`%${search}%`);
    idx++;
  }

  if (category) {
    if (!isNaN(category)) {
      conditions.push(`p.category_id = $${idx}`);
      values.push(parseInt(category));
    } else {
      conditions.push(`c.name ILIKE $${idx}`);
      values.push(`%${category}%`);
    }
    idx++;
  }

  if (minPrice) {
    conditions.push(`p.price >= $${idx}`);
    values.push(parseFloat(minPrice));
    idx++;
  }

  if (maxPrice) {
    conditions.push(`p.price <= $${idx}`);
    values.push(parseFloat(maxPrice));
    idx++;
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", values, nextIdx: idx };
}

function buildOrder(sort) {
  const map = {
    price_asc:  "ORDER BY p.price ASC",
    "price-low": "ORDER BY p.price ASC",
    price_desc: "ORDER BY p.price DESC",
    "price-high": "ORDER BY p.price DESC",
    newest:     "ORDER BY p.created_at DESC",
    oldest:     "ORDER BY p.created_at ASC",
    name_asc:   "ORDER BY p.name ASC",
    name_desc:  "ORDER BY p.name DESC",
  };
  return map[sort] || "ORDER BY p.created_at DESC";
}

// GET /api/products — paginated, filtered, sorted (public)
router.get("/", async (req, res) => {
  try {
    const pageNum  = Math.max(1, parseInt(req.query.page)  || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(req.query.limit) || 12));
    const offset   = (pageNum - 1) * limitNum;

    const { where, values, nextIdx } = buildWhere(req.query);
    const order = buildOrder(req.query.sort);

    // Count query (no pagination, no images JOIN needed)
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT p.id) AS total
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataValues = [...values, limitNum, offset];
    const dataResult = await pool.query(
      `SELECT
         p.*,
         c.name AS category_name,
         COALESCE(
           json_agg(
             json_build_object('id', pi.id, 'image_url', pi.image_url, 'is_primary', pi.is_primary)
             ORDER BY pi.display_order ASC
           ) FILTER (WHERE pi.id IS NOT NULL),
           '[]'::json
         ) AS images
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_images pi ON pi.product_id = p.id
       ${where}
       GROUP BY p.id, c.name
       ${order}
       LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
      dataValues
    );

    res.json({
      products: dataResult.rows,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id — single product with all images (public)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT
         p.*,
         c.name AS category_name,
         COALESCE(
           json_agg(
             json_build_object('id', pi.id, 'image_url', pi.image_url, 'is_primary', pi.is_primary)
             ORDER BY pi.display_order ASC
           ) FILTER (WHERE pi.id IS NOT NULL),
           '[]'::json
         ) AS images
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_images pi ON pi.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, c.name`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Product not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — create (admin)
router.post("/", authenticateToken, verifyAdmin, upload.array("images", 10), async (req, res) => {
  const { name, price, description, stock, original_price, category_id } = req.body || {};
  if (!name || !price) return res.status(400).json({ error: "Name and price are required" });

  try {
    const productResult = await pool.query(
      "INSERT INTO products (name, price, original_price, description, stock, category_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *",
      [name, price, original_price || null, description || null, stock || 0, category_id || null]
    );
    const productId = productResult.rows[0].id;
    const images = [];

    if (req.files?.length) {
      for (let i = 0; i < req.files.length; i++) {
        const url = `${req.protocol}://${req.get("host")}/uploads/${req.files[i].filename}`;
        const img = await pool.query(
          "INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES ($1,$2,$3,$4) RETURNING *",
          [productId, url, i, i === 0]
        );
        images.push(img.rows[0]);
      }
    }

    res.status(201).json({ ...productResult.rows[0], images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — update (admin)
router.put("/:id", authenticateToken, verifyAdmin, upload.array("images", 10), async (req, res) => {
  const { id } = req.params;
  const { name, price, description, stock, original_price, removeImageIds, category_id } = req.body || {};

  try {
    const result = await pool.query(
      "UPDATE products SET name=$1, price=$2, original_price=$3, description=$4, stock=$5, category_id=$6 WHERE id=$7 RETURNING *",
      [name || null, price || null, original_price || null, description || null, stock || 0, category_id || null, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Product not found" });

    if (removeImageIds) {
      const ids = Array.isArray(removeImageIds) ? removeImageIds : [removeImageIds];
      await pool.query("DELETE FROM product_images WHERE product_id=$1 AND id = ANY($2::int[])", [id, ids]);
    }

    if (req.files?.length) {
      const maxOrd = await pool.query(
        "SELECT COALESCE(MAX(display_order),-1) AS m FROM product_images WHERE product_id=$1", [id]
      );
      let nextOrder = maxOrd.rows[0].m + 1;
      for (const file of req.files) {
        const url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
        await pool.query(
          "INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES ($1,$2,$3,false)",
          [id, url, nextOrder++]
        );
      }
    }

    const imagesResult = await pool.query(
      "SELECT id, image_url, is_primary FROM product_images WHERE product_id=$1 ORDER BY display_order ASC", [id]
    );
    res.json({ ...result.rows[0], images: imagesResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id (admin)
router.delete("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM products WHERE id=$1 RETURNING *", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted", product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:productId/images/:imageId (admin)
router.delete("/:productId/images/:imageId", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM product_images WHERE id=$1 AND product_id=$2 RETURNING *",
      [req.params.imageId, req.params.productId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Image not found" });
    res.json({ message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:productId/images/:imageId/primary (admin)
router.put("/:productId/images/:imageId/primary", authenticateToken, verifyAdmin, async (req, res) => {
  const { productId, imageId } = req.params;
  try {
    await pool.query("UPDATE product_images SET is_primary=FALSE WHERE product_id=$1", [productId]);
    const result = await pool.query(
      "UPDATE product_images SET is_primary=TRUE WHERE id=$1 AND product_id=$2 RETURNING *",
      [imageId, productId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Image not found" });
    res.json({ message: "Primary image updated", image: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
