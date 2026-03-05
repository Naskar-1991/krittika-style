const express = require("express");
const router = express.Router();
const pool = require("../db");
const crypto = require("crypto");

// Verify Shiprocket webhook signature
const verifyShiprocketSignature = (req, secret) => {
  const signature = req.headers['x-shipment-signature'];
  if (!signature) return false;

  const payload = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
};

// Webhook endpoint for Shiprocket events
router.post("/shiprocket", async (req, res) => {
  try {
    // Verify signature (optional but recommended)
    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    if (webhookSecret && !verifyShiprocketSignature(req, webhookSecret)) {
      console.warn("Invalid Shiprocket webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const eventData = req.body;
    console.log("Shiprocket Webhook received:", eventData);

    const {
      event_type,
      shipment_id,
      order_id,
      tracking_number,
      status,
      location,
      courier_name,
      delivered_date,
      estimated_delivery_date,
      events = []
    } = eventData;

    // Extract order ID from order_id (format: ORDER-123)
    let dbOrderId = null;
    if (order_id && typeof order_id === 'string') {
      const matches = order_id.match(/ORDER-(\d+)/);
      dbOrderId = matches ? matches[1] : null;
    }

    if (!dbOrderId) {
      console.warn("Could not extract order ID from webhook");
      return res.status(400).json({ error: "Invalid order_id format" });
    }

    // Get order from database
    const orderResult = await pool.query("SELECT * FROM orders WHERE id=$1", [dbOrderId]);
    if (orderResult.rows.length === 0) {
      console.warn(`Order ${dbOrderId} not found`);
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    // Update order with shipment details
    let statusToUpdate = order.status;
    
    // Map Shiprocket status to app status
    const statusMap = {
      'cancelled': 'cancelled',
      'rto_initiated': 'processing',
      'rto_in_transit': 'processing',
      'rto_delivered': 'cancelled',
      'rto_failed': 'processing',
      'delivered': 'delivered',
      'lost_in_transit': 'cancelled',
      'out_for_delivery': 'shipped',
      'in_transit': 'shipped',
      'pickup_pending': 'processing',
      'ready_to_ship': 'processing',
      'pickup_done': 'processing'
    };

    statusToUpdate = statusMap[status] || order.status;

    // Update order with tracking and status info
    await pool.query(
      `UPDATE orders 
       SET shiprocket_shipment_id=$1, 
           tracking_number=$2, 
           carrier_name=$3, 
           estimated_delivery_date=$4,
           actual_delivery_date=$5,
           shiprocket_status=$6,
           status=$7
       WHERE id=$8`,
      [
        shipment_id || order.shiprocket_shipment_id,
        tracking_number || order.tracking_number,
        courier_name || order.carrier_name,
        estimated_delivery_date || order.estimated_delivery_date,
        delivered_date || order.actual_delivery_date,
        status,
        statusToUpdate,
        dbOrderId
      ]
    );

    // Store shipping event
    await pool.query(
      `INSERT INTO shipping_events (order_id, shipment_id, event_type, event_data, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [dbOrderId, shipment_id, event_type, JSON.stringify(eventData), status]
    );

    // Store tracking history for each event
    if (events && Array.isArray(events)) {
      for (const event of events) {
        await pool.query(
          `INSERT INTO tracking_history (order_id, tracking_number, status, location, timestamp, additional_info)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (order_id, tracking_number, timestamp) DO NOTHING`,
          [
            dbOrderId,
            tracking_number,
            event.status,
            event.location,
            event.timestamp || new Date(),
            JSON.stringify(event)
          ]
        );
      }
    } else if (location || status) {
      // Store current event as tracking history
      await pool.query(
        `INSERT INTO tracking_history (order_id, tracking_number, status, location, timestamp, additional_info)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [
          dbOrderId,
          tracking_number,
          status,
          location,
          JSON.stringify({ event_type, shipment_id })
        ]
      );
    }

    console.log(`Order ${dbOrderId} updated with Shiprocket event: ${event_type}`);

    res.json({
      success: true,
      message: "Webhook processed successfully",
      order_id: dbOrderId
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Webhook test endpoint
router.post("/shiprocket/test", (req, res) => {
  console.log("Test webhook received:", req.body);
  res.json({
    success: true,
    message: "Test webhook received",
    data: req.body
  });
});

module.exports = router;
