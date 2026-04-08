const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

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

// Get all returns (admin only)
router.get("/", authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.name, u.email, o.id as order_id, o.total_amount,
             COUNT(DISTINCT ri.id) as item_count,
             COALESCE(rf.amount, 0) as refund_amount
      FROM returns r
      JOIN users u ON r.user_id = u.id
      JOIN orders o ON r.order_id = o.id
      LEFT JOIN return_items ri ON r.id = ri.return_id
      LEFT JOIN refunds rf ON r.id = rf.return_id
    `;

    let params = [];
    
    if (status) {
      query += ` WHERE r.status = $1`;
      params.push(status);
    }

    query += ` GROUP BY r.id, u.name, u.email, o.id, o.total_amount, rf.amount
               ORDER BY r.created_at DESC
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(DISTINCT r.id) as total FROM returns r";
    if (status) {
      countQuery += " WHERE r.status = $1";
    }
    
    const countResult = await pool.query(
      countQuery,
      status ? [status] : []
    );

    res.json({
      returns: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
      pages: Math.ceil(countResult.rows[0].total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get return details (admin)
router.get("/:returnId", authenticateToken, checkAdmin, async (req, res) => {
  try {
    const returnId = req.params.returnId;

    const returnResult = await pool.query(
      `SELECT r.*, u.name, u.email, o.id as order_id, o.total_amount
       FROM returns r
       JOIN users u ON r.user_id = u.id
       JOIN orders o ON r.order_id = o.id
       WHERE r.id = $1`,
      [returnId]
    );

    if (returnResult.rows.length === 0) {
      return res.status(404).json({ error: "Return not found" });
    }

    const itemsResult = await pool.query(
      `SELECT ri.*, p.name, p.price, oi.quantity as original_quantity
       FROM return_items ri
       LEFT JOIN products p ON ri.product_id = p.id
       LEFT JOIN order_items oi ON ri.order_item_id = oi.id
       WHERE ri.return_id = $1`,
      [returnId]
    );

    const refundResult = await pool.query(
      "SELECT * FROM refunds WHERE return_id = $1",
      [returnId]
    );

    const historyResult = await pool.query(
      "SELECT * FROM return_status_history WHERE return_id = $1 ORDER BY created_at DESC",
      [returnId]
    );

    res.json({
      return: returnResult.rows[0],
      items: itemsResult.rows,
      refund: refundResult.rows[0] || null,
      statusHistory: historyResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve return (admin)
router.patch("/:returnId/approve", authenticateToken, checkAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const returnId = req.params.returnId;
    const { message } = req.body;

    const returnCheck = await client.query(
      "SELECT * FROM returns WHERE id = $1",
      [returnId]
    );

    if (returnCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Return not found" });
    }

    if (returnCheck.rows[0].status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Can only approve pending returns" });
    }

    // Update return status
    const result = await client.query(
      `UPDATE returns SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [returnId]
    );

    // Log status change
    await client.query(
      `INSERT INTO return_status_history (return_id, old_status, new_status, changed_by, reason)
       VALUES ($1, 'pending', 'approved', $2, $3)`,
      [returnId, req.user.email, message || "Return approved by admin"]
    );

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Reject return (admin)
router.patch("/:returnId/reject", authenticateToken, checkAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const returnId = req.params.returnId;
    const { reason } = req.body;

    const returnCheck = await client.query(
      "SELECT * FROM returns WHERE id = $1",
      [returnId]
    );

    if (returnCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Return not found" });
    }

    if (returnCheck.rows[0].status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Can only reject pending returns" });
    }

    // Update return status
    const result = await client.query(
      `UPDATE returns SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [returnId]
    );

    // Update refund status
    await client.query(
      `UPDATE refunds SET status = 'failed' WHERE return_id = $1`,
      [returnId]
    );

    // Log status change
    await client.query(
      `INSERT INTO return_status_history (return_id, old_status, new_status, changed_by, reason)
       VALUES ($1, 'pending', 'rejected', $2, $3)`,
      [returnId, req.user.email, reason || "Return rejected by admin"]
    );

    // Reset returned quantities
    const returnItems = await client.query(
      "SELECT * FROM return_items WHERE return_id = $1",
      [returnId]
    );

    for (const item of returnItems.rows) {
      await client.query(
        `UPDATE order_items SET returned_quantity = 0 WHERE id = $1`,
        [item.order_item_id]
      );
    }

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Mark as received by warehouse (admin)
router.patch("/:returnId/received", authenticateToken, checkAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const returnId = req.params.returnId;

    const returnCheck = await client.query(
      "SELECT * FROM returns WHERE id = $1",
      [returnId]
    );

    if (returnCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Return not found" });
    }

    const currentStatus = returnCheck.rows[0].status;
    if (!["approved", "shipped"].includes(currentStatus)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid return status for receipt" });
    }

    // Update return status
    const result = await client.query(
      `UPDATE returns SET status = 'received', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [returnId]
    );

    // Log status change
    await client.query(
      `INSERT INTO return_status_history (return_id, old_status, new_status, changed_by, reason)
       VALUES ($1, $2, 'received', $3, 'Item received at warehouse')`,
      [returnId, currentStatus, req.user.email]
    );

    // Re-add items to inventory (increase stock)
    const returnItems = await client.query(
      `SELECT ri.product_id, ri.quantity FROM return_items WHERE return_id = $1`,
      [returnId]
    );

    for (const item of returnItems.rows) {
      await client.query(
        `UPDATE products SET stock = stock + $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Process refund (admin)
router.patch("/:returnId/refund", authenticateToken, checkAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const returnId = req.params.returnId;

    const returnCheck = await client.query(
      "SELECT * FROM returns WHERE id = $1",
      [returnId]
    );

    if (returnCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Return not found" });
    }

    if (returnCheck.rows[0].status !== "received") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Item must be received before refunding" });
    }

    // Update return status
    const result = await client.query(
      `UPDATE returns SET status = 'refunded', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [returnId]
    );

    // Update refund status
    const refundResult = await client.query(
      `UPDATE refunds SET status = 'completed' WHERE return_id = $1 RETURNING *`,
      [returnId]
    );

    // Log status change
    await client.query(
      `INSERT INTO return_status_history (return_id, old_status, new_status, changed_by, reason)
       VALUES ($1, 'received', 'refunded', $2, 'Refund processed')`,
      [returnId, req.user.email]
    );

    await client.query("COMMIT");
    res.json({
      return: result.rows[0],
      refund: refundResult.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get refund statistics (admin)
router.get("/stats/summary", authenticateToken, checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT r.id) as total_returns,
        COUNT(DISTINCT CASE WHEN r.status = 'pending' THEN r.id END) as pending_returns,
        COUNT(DISTINCT CASE WHEN r.status = 'approved' THEN r.id END) as approved_returns,
        COUNT(DISTINCT CASE WHEN r.status = 'refunded' THEN r.id END) as refunded_returns,
        COALESCE(SUM(CASE WHEN rf.status = 'completed' THEN rf.amount ELSE 0 END), 0) as total_refunded,
        COALESCE(SUM(CASE WHEN rf.status = 'pending' THEN rf.amount ELSE 0 END), 0) as pending_refunds
      FROM returns r
      LEFT JOIN refunds rf ON r.id = rf.return_id
    `);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
