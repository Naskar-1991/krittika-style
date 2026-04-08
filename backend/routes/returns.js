const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

// Get all returns for current user
router.get("/my-returns", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT r.*, o.id as order_id, o.total_amount, o.created_at as order_date
       FROM returns r
       JOIN orders o ON r.order_id = o.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get return details with items
router.get("/:returnId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const returnId = req.params.returnId;

    // Get return header
    const returnResult = await pool.query(
      `SELECT r.*, o.id as order_id, o.total_amount
       FROM returns r
       JOIN orders o ON r.order_id = o.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [returnId, userId]
    );

    if (returnResult.rows.length === 0) {
      return res.status(404).json({ error: "Return not found" });
    }

    // Get return items
    const itemsResult = await pool.query(
      `SELECT ri.*, p.name, p.price, oi.quantity as original_quantity
       FROM return_items ri
       LEFT JOIN products p ON ri.product_id = p.id
       LEFT JOIN order_items oi ON ri.order_item_id = oi.id
       WHERE ri.return_id = $1`,
      [returnId]
    );

    // Get refund info if exists
    const refundResult = await pool.query(
      "SELECT * FROM refunds WHERE return_id = $1",
      [returnId]
    );

    // Get status history
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

// Create return request
router.post("/", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const userId = req.user.id;
    const { orderId, items, reason, description } = req.body;

    // Validate order exists and belongs to user
    const orderCheck = await client.query(
      "SELECT id, total_amount, created_at FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId]
    );

    if (orderCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderCheck.rows[0];
    const orderDate = new Date(order.created_at);
    const daysSinceOrder = Math.floor((Date.now() - orderDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOrder > 30) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Return window expired (30 days)" });
    }

    // Create return request
    const returnResult = await client.query(
      `INSERT INTO returns (user_id, order_id, status, reason, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, orderId, "pending", reason, description]
    );

    const returnId = returnResult.rows[0].id;

    // Add return items
    let totalReturnAmount = 0;
    
    for (const item of items) {
      // Get order item details
      const orderItemResult = await client.query(
        "SELECT id, product_id, quantity, price FROM order_items WHERE id = $1 AND order_id = $2",
        [item.orderItemId, orderId]
      );

      if (orderItemResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: `Order item ${item.orderItemId} not found` });
      }

      const orderItem = orderItemResult.rows[0];

      // Add to return_items
      await client.query(
        `INSERT INTO return_items (return_id, product_id, order_item_id, quantity, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [returnId, orderItem.product_id, item.orderItemId, item.quantity, item.reason || reason]
      );

      // Calculate refund amount
      totalReturnAmount += orderItem.price * item.quantity;

      // Update returned quantity in order_items
      await client.query(
        `UPDATE order_items 
         SET returned_quantity = returned_quantity + $1 
         WHERE id = $2`,
        [item.quantity, item.orderItemId]
      );
    }

    // Create refund record
    await client.query(
      `INSERT INTO refunds (return_id, user_id, order_id, amount, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [returnId, userId, orderId, totalReturnAmount, "pending"]
    );

    // Log status change
    await client.query(
      `INSERT INTO return_status_history (return_id, old_status, new_status, changed_by, reason)
       VALUES ($1, NULL, $2, 'user', $3)`,
      [returnId, "pending", "Return request created"]
    );

    await client.query("COMMIT");
    res.status(201).json(returnResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Check if order can be returned
router.get("/check/:orderId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.orderId;

    const result = await pool.query(
      `SELECT o.id, o.created_at, o.total_amount,
              CASE 
                WHEN DATE_PART('day', NOW() - o.created_at) > 30 THEN false
                ELSE true
              END as can_return
       FROM orders o
       WHERE o.id = $1 AND o.user_id = $2`,
      [orderId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel return request (only if pending)
router.patch("/:returnId/cancel", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const userId = req.user.id;
    const returnId = req.params.returnId;

    const returnCheck = await client.query(
      "SELECT * FROM returns WHERE id = $1 AND user_id = $2",
      [returnId, userId]
    );

    if (returnCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Return not found" });
    }

    if (returnCheck.rows[0].status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Can only cancel pending return requests" });
    }

    // Update return status
    const result = await client.query(
      `UPDATE returns SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
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
       VALUES ($1, $2, 'cancelled', 'user', 'User cancelled return request')`,
      [returnId, "pending"]
    );

    // Reset returned_quantity in order_items
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

module.exports = router;
