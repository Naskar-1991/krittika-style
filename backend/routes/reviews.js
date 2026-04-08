const express = require("express");
const router = express.Router();
const pool = require("../db");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const SECRET = process.env.JWT_SECRET || "supersecret";
  const jwt = require("jsonwebtoken");

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware to check admin role
const checkAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [req.user.id]
    );
    
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all reviews for a product
 * GET /api/reviews/product/:productId
 */
router.get("/product/:productId", async (req, res) => {
  const { productId } = req.params;
  const { sortBy = "recent", limit = 10, offset = 0 } = req.query;

  try {
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    let orderBy = "r.created_at DESC";
    if (sortBy === "helpful") {
      orderBy = "(r.helpful_count - r.unhelpful_count) DESC";
    } else if (sortBy === "rating_high") {
      orderBy = "r.rating DESC";
    } else if (sortBy === "rating_low") {
      orderBy = "r.rating ASC";
    }

    const result = await pool.query(
      `SELECT 
        r.id,
        r.product_id,
        r.user_id,
        r.rating,
        r.title,
        r.review_text,
        r.helpful_count,
        r.unhelpful_count,
        r.is_verified_purchase,
        r.created_at,
        u.name as user_name,
        u.id as user_id
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );

    // Get review statistics
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM reviews
       WHERE product_id = $1`,
      [productId]
    );

    res.json({
      reviews: result.rows,
      stats: statsResult.rows[0],
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

/**
 * Get single review by ID
 * GET /api/reviews/:reviewId
 */
router.get("/:reviewId", async (req, res) => {
  const { reviewId } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching review:", err);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

/**
 * Create a new review
 * POST /api/reviews
 * Requires: product_id, rating, title, review_text
 */
router.post("/", verifyToken, async (req, res) => {
  const { product_id, rating, title, review_text } = req.body;
  const userId = req.userId;

  try {
    // Validate input
    if (!product_id || !rating || !title || !review_text) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    if (title.length > 255) {
      return res.status(400).json({ error: "Title must be less than 255 characters" });
    }

    // Check if product exists
    const productCheck = await pool.query(
      "SELECT id FROM products WHERE id = $1",
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if user has already reviewed this product
    const existingReview = await pool.query(
      "SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2",
      [product_id, userId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: "You have already reviewed this product" });
    }

    // Create the review
    const result = await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, title, review_text, is_verified_purchase)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, product_id, user_id, rating, title, review_text, helpful_count, unhelpful_count, created_at`,
      [product_id, userId, rating, title, review_text]
    );

    res.status(201).json({
      message: "Review created successfully",
      review: result.rows[0],
    });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

/**
 * Update a review
 * PUT /api/reviews/:reviewId
 */
router.put("/:reviewId", verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const { rating, title, review_text } = req.body;
  const userId = req.userId;

  try {
    // Check if review exists and belongs to the user
    const reviewCheck = await pool.query(
      "SELECT user_id FROM reviews WHERE id = $1",
      [reviewId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (reviewCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "You can only edit your own reviews" });
    }

    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    if (title && title.length > 255) {
      return res.status(400).json({ error: "Title must be less than 255 characters" });
    }

    // Update review
    const result = await pool.query(
      `UPDATE reviews 
       SET rating = COALESCE($1, rating),
           title = COALESCE($2, title),
           review_text = COALESCE($3, review_text)
       WHERE id = $4
       RETURNING id, product_id, user_id, rating, title, review_text, created_at, updated_at`,
      [rating || null, title || null, review_text || null, reviewId]
    );

    res.json({
      message: "Review updated successfully",
      review: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ error: "Failed to update review" });
  }
});

/**
 * Delete a review
 * DELETE /api/reviews/:reviewId
 */
router.delete("/:reviewId", verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.userId;

  try {
    // Check if review exists and belongs to the user
    const reviewCheck = await pool.query(
      "SELECT user_id FROM reviews WHERE id = $1",
      [reviewId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (reviewCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "You can only delete your own reviews" });
    }

    // Delete review
    await pool.query("DELETE FROM reviews WHERE id = $1", [reviewId]);

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

/**
 * Mark review as helpful
 * POST /api/reviews/:reviewId/helpful
 */
router.post("/:reviewId/helpful", async (req, res) => {
  const { reviewId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE reviews 
       SET helpful_count = helpful_count + 1
       WHERE id = $1
       RETURNING helpful_count, unhelpful_count`,
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({
      message: "Marked as helpful",
      helpful_count: result.rows[0].helpful_count,
      unhelpful_count: result.rows[0].unhelpful_count,
    });
  } catch (err) {
    console.error("Error marking as helpful:", err);
    res.status(500).json({ error: "Failed to mark as helpful" });
  }
});

/**
 * Mark review as unhelpful
 * POST /api/reviews/:reviewId/unhelpful
 */
router.post("/:reviewId/unhelpful", async (req, res) => {
  const { reviewId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE reviews 
       SET unhelpful_count = unhelpful_count + 1
       WHERE id = $1
       RETURNING helpful_count, unhelpful_count`,
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({
      message: "Marked as unhelpful",
      helpful_count: result.rows[0].helpful_count,
      unhelpful_count: result.rows[0].unhelpful_count,
    });
  } catch (err) {
    console.error("Error marking as unhelpful:", err);
    res.status(500).json({ error: "Failed to mark as unhelpful" });
  }
});

/**
 * Get review statistics for a product
 * GET /api/reviews/stats/:productId
 */
router.get("/stats/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating)::NUMERIC(2,1) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM reviews
       WHERE product_id = $1`,
      [productId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

/**
 * ============================================================
 * ADMIN ENDPOINTS - Reviews Management
 * ============================================================
 */

/**
 * Get all reviews (admin only)
 * GET /api/reviews/admin/all
 */
router.get("/admin/all", verifyToken, checkAdmin, async (req, res) => {
  const { productId, userId, rating, sortBy = "recent", page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        r.id,
        r.product_id,
        r.user_id,
        r.rating,
        r.title,
        r.review_text,
        r.helpful_count,
        r.unhelpful_count,
        r.is_verified_purchase,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        u.email as user_email,
        p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE 1=1
    `;

    let params = [];
    let paramCount = 1;

    // Apply filters
    if (productId) {
      query += ` AND r.product_id = $${paramCount}`;
      params.push(productId);
      paramCount++;
    }

    if (userId) {
      query += ` AND r.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    if (rating) {
      query += ` AND r.rating = $${paramCount}`;
      params.push(rating);
      paramCount++;
    }

    // Apply sorting
    let orderBy = "r.created_at DESC";
    if (sortBy === "helpful") {
      orderBy = "(r.helpful_count - r.unhelpful_count) DESC";
    } else if (sortBy === "rating_high") {
      orderBy = "r.rating DESC";
    } else if (sortBy === "rating_low") {
      orderBy = "r.rating ASC";
    }

    query += ` ORDER BY ${orderBy}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const reviews = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM reviews r WHERE 1=1`;
    let countParams = [];
    let countParamCount = 1;

    if (productId) {
      countQuery += ` AND r.product_id = $${countParamCount}`;
      countParams.push(productId);
      countParamCount++;
    }
    if (userId) {
      countQuery += ` AND r.user_id = $${countParamCount}`;
      countParams.push(userId);
      countParamCount++;
    }
    if (rating) {
      countQuery += ` AND r.rating = $${countParamCount}`;
      countParams.push(rating);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      reviews: reviews.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

/**
 * Get review statistics (admin overview)
 * GET /api/reviews/admin/stats/overview
 */
router.get("/admin/stats/overview", verifyToken, checkAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(DISTINCT product_id) as products_with_reviews,
        COUNT(DISTINCT user_id) as users_with_reviews,
        AVG(rating)::NUMERIC(2,1) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
        SUM(helpful_count) as total_helpful_votes,
        COUNT(CASE WHEN is_verified_purchase = true THEN 1 END) as verified_reviews
      FROM reviews
    `);

    // Get top rated products
    const topProducts = await pool.query(`
      SELECT 
        p.id,
        p.name,
        COUNT(r.id) as review_count,
        AVG(r.rating)::NUMERIC(2,1) as average_rating
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      GROUP BY p.id, p.name
      HAVING COUNT(r.id) > 0
      ORDER BY average_rating DESC, review_count DESC
      LIMIT 5
    `);

    // Get recent reviews
    const recentReviews = await pool.query(`
      SELECT 
        r.id,
        r.rating,
        r.title,
        u.name as user_name,
        p.name as product_name,
        r.created_at
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);

    res.json({
      stats: stats.rows[0],
      topProducts: topProducts.rows,
      recentReviews: recentReviews.rows
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

/**
 * Delete review (admin only)
 * DELETE /api/reviews/admin/:reviewId
 */
router.delete("/admin/:reviewId", verifyToken, checkAdmin, async (req, res) => {
  const { reviewId } = req.params;

  try {
    const reviewCheck = await pool.query(
      "SELECT id FROM reviews WHERE id = $1",
      [reviewId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    await pool.query("DELETE FROM reviews WHERE id = $1", [reviewId]);

    res.json({ 
      message: "Review deleted successfully by admin",
      reviewId 
    });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

/**
 * Flag/unflag review (admin only)
 * PATCH /api/reviews/admin/:reviewId/flag
 */
router.patch("/admin/:reviewId/flag", verifyToken, checkAdmin, async (req, res) => {
  const { reviewId } = req.params;
  const { flagged } = req.body;

  try {
    const result = await pool.query(
      `UPDATE reviews 
       SET is_flagged = $1, flagged_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = $2
       RETURNING *`,
      [flagged, reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({
      message: flagged ? "Review flagged" : "Review unflagged",
      review: result.rows[0]
    });
  } catch (err) {
    console.error("Error flagging review:", err);
    res.status(500).json({ error: "Failed to update review" });
  }
});

module.exports = router;
