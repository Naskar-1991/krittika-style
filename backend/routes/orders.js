const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const ShiprocketClient = require("../shiprocketService");

const SECRET = process.env.JWT_SECRET || "supersecret";
const shiprocket = new ShiprocketClient();

// Middleware to verify JWT
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

// Create order (authenticated user)
router.post("/", authenticateToken, async (req, res) => {
  const { items, totalAmount, shippingInfo } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Order must contain at least one item" });
  }

  if (!shippingInfo) {
    return res.status(400).json({ error: "Shipping information is required" });
  }

  try {
    // Get user details for Shiprocket
    const userResult = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult.rows[0];

    // Create order in database
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, status, total_amount, shipping_info, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, user_id, status, total_amount, created_at`,
      [req.user.id, "pending", totalAmount || 0, JSON.stringify(shippingInfo)]
    );

    const order = orderResult.rows[0];

    // Insert order items
    let totalWeight = 0;
    const orderItems = [];
    for (const item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [order.id, item.id, item.quantity || 1, item.price || 0]
      );
      
      // Get product details for Shiprocket
      const productResult = await pool.query("SELECT * FROM products WHERE id=$1", [item.id]);
      if (productResult.rows.length > 0) {
        const product = productResult.rows[0];
        totalWeight += (product.weight || 0.5) * (item.quantity || 1);
        orderItems.push({
          name: product.name,
          sku: product.id,
          units: item.quantity || 1,
          selling_price: item.price || 0,
          discount: 0,
          tax: 0,
          hsn_code: product.hsn_code || ""
        });
      }
    }

    // Prepare Shiprocket order data
    const shiprocketOrderData = {
      order_id: `ORDER-${order.id}`,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location_id: process.env.SHIPROCKET_WAREHOUSE_ID || '50403',
      billing_customer_name: user.name || shippingInfo.firstName + " " + shippingInfo.lastName,
      billing_email: user.email,
      billing_phone: user.phone || shippingInfo.phone,
      billing_address: shippingInfo.address,
      billing_city: shippingInfo.city,
      billing_state: shippingInfo.state,
      billing_country: shippingInfo.country || "India",
      billing_pincode: shippingInfo.zipcode,
      shipping_customer_name: shippingInfo.firstName + " " + shippingInfo.lastName,
      shipping_email: user.email,
      shipping_phone: shippingInfo.phone,
      shipping_address: shippingInfo.address,
      shipping_city: shippingInfo.city,
      shipping_state: shippingInfo.state,
      shipping_country: shippingInfo.country || "India",
      shipping_pincode: shippingInfo.zipcode,
      order_items: orderItems,
      sub_total: totalAmount || 0,
      weight: totalWeight || 1
    };

    // Try to create order in Shiprocket (non-blocking - if it fails, order still exists locally)
    try {
      const shiprocketResponse = await shiprocket.createOrder(shiprocketOrderData);
      console.log('Shiprocket Order Created:', shiprocketResponse);
      
      // Update order with Shiprocket reference if available
      if (shiprocketResponse.order_id) {
        await pool.query(
          "UPDATE orders SET is_shiprocket_generated=$1 WHERE id=$2",
          [true, order.id]
        );
      }
    } catch (shiprocketError) {
      console.warn('Shiprocket integration failed, but local order created:', shiprocketError.message);
      // Continue without blocking - user's order is still created locally
    }

    // Log successful order creation
    console.log(`Order ${order.id} created by user ${req.user.id}`);

    res.status(201).json({ 
      message: "Order created successfully", 
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.total_amount,
        createdAt: order.created_at
      }
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (admin only)
router.get("/", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.user_id, o.status, o.total_amount, o.created_at,
              u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order by ID (admin or order owner)
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get order
    const orderResult = await pool.query(
      `SELECT o.id, o.user_id, o.status, o.total_amount, o.created_at,
              u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id=$1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    // Check if user is admin or order owner
    const isAdmin = (await pool.query("SELECT role FROM users WHERE id=$1", [req.user.id])).rows[0].role === "admin";
    if (!isAdmin && order.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get order items
    const itemsResult = await pool.query(
      `SELECT oi.id, oi.product_id, oi.quantity, oi.price,
              p.name, p.image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id=$1`,
      [id]
    );

    res.json({
      ...order,
      items: itemsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's orders (authenticated user)
router.get("/user/my-orders", authenticateToken, async (req, res) => {
  try {
    // First, get all orders for this user
    const ordersResult = await pool.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, o.shipping_info,
              o.shiprocket_shipment_id, o.tracking_number, o.carrier_name,
              o.estimated_delivery_date, o.shiprocket_status, o.tracking_url
       FROM orders o
       WHERE o.user_id=$1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    // For each order, fetch the items and tracking details
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          `SELECT oi.id, oi.product_id, oi.quantity, oi.price,
                  p.name, p.image
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id=$1`,
          [order.id]
        );

        // Get tracking history if tracking number exists
        let trackingHistory = [];
        if (order.tracking_number) {
          const historyResult = await pool.query(
            `SELECT status, location, timestamp, additional_info 
             FROM tracking_history 
             WHERE order_id=$1 
             ORDER BY timestamp DESC`,
            [order.id]
          );
          trackingHistory = historyResult.rows;
        }

        return {
          ...order,
          items: itemsResult.rows,
          trackingHistory: trackingHistory
        };
      })
    );

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (admin only)
router.put("/:id/status", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const result = await pool.query(
      "UPDATE orders SET status=$1 WHERE id=$2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order status updated", order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order (admin only)
router.delete("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Delete order items first
    await pool.query("DELETE FROM order_items WHERE order_id=$1", [id]);
    
    // Delete order
    const result = await pool.query(
      "DELETE FROM orders WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order deleted successfully", order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SHIPROCKET INTEGRATION ENDPOINTS ====================

// Create Shiprocket shipment for an order
router.post("/:id/shiprocket/create-shipment", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { courierPartner, isHeavyItem = false } = req.body;

  try {
    // Get order details
    const orderResult = await pool.query(
      `SELECT o.*, oi.product_id, oi.quantity, oi.price, p.name, p.weight
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.id=$1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];
    const shippingInfo = typeof order.shipping_info === 'string' ? JSON.parse(order.shipping_info) : order.shipping_info;

    // Calculate total weight
    let totalWeight = 0;
    const orderItems = [];
    for (const item of orderResult.rows) {
      totalWeight += (item.weight || 0.5) * item.quantity;
      if (!orderItems.find(oi => oi.product_id === item.product_id)) {
        orderItems.push({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          weight: item.weight || 0.5
        });
      }
    }

    // Prepare shipment data
    const shipmentData = {
      order_id: `ORDER-${order.id}`,
      shipment_date: new Date().toISOString().split('T')[0],
      pickup_location_id: process.env.SHIPROCKET_WAREHOUSE_ID || '50403',
      email: order.email,
      phone: shippingInfo.phone,
      name: shippingInfo.firstName + " " + shippingInfo.lastName,
      address: shippingInfo.address,
      address_type: 'home',
      city: shippingInfo.city,
      state: shippingInfo.state,
      country: shippingInfo.country || 'India',
      pincode: shippingInfo.zipcode,
      weight: totalWeight,
      length: 10,
      breadth: 10,
      height: 10,
      is_fragile: false,
      is_heavy_item: isHeavyItem
    };

    // Create shipment in Shiprocket
    const shipmentResponse = await shiprocket.createShipment(shipmentData);
    
    if (shipmentResponse.shipments && shipmentResponse.shipments.length > 0) {
      const shipmentId = shipmentResponse.shipments[0].shipment_id;
      const trackingNumber = shipmentResponse.shipments[0].tracking_number;

      // Update order with shipment details
      await pool.query(
        `UPDATE orders 
         SET shiprocket_shipment_id=$1, tracking_number=$2, shiprocket_status=$3, status=$4
         WHERE id=$5`,
        [shipmentId, trackingNumber || null, 'pickup_pending', 'processing', id]
      );

      res.json({
        message: "Shipment created successfully",
        shipment: {
          shipment_id: shipmentId,
          tracking_number: trackingNumber,
          status: 'pickup_pending'
        }
      });
    } else {
      res.status(400).json({ error: "Failed to create shipment", details: shipmentResponse });
    }
  } catch (err) {
    console.error("Shiprocket shipment creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get tracking details
router.get("/:id/tracking", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify order ownership (user or admin)
    const orderResult = await pool.query("SELECT * FROM orders WHERE id=$1", [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];
    const isAdmin = (await pool.query("SELECT role FROM users WHERE id=$1", [req.user.id])).rows[0].role === "admin";
    
    if (!isAdmin && order.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Return tracking info from database
    const trackingInfo = {
      tracking_number: order.tracking_number,
      carrier_name: order.carrier_name,
      shiprocket_status: order.shiprocket_status,
      estimated_delivery_date: order.estimated_delivery_date,
      actual_delivery_date: order.actual_delivery_date,
      tracking_url: order.tracking_url
    };

    // Get tracking history
    const historyResult = await pool.query(
      `SELECT status, location, timestamp, additional_info 
       FROM tracking_history 
       WHERE order_id=$1 
       ORDER BY timestamp DESC`,
      [id]
    );

    res.json({
      order: {
        id: order.id,
        status: order.status,
        ...trackingInfo
      },
      history: historyResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync tracking details from Shiprocket
router.post("/:id/sync-tracking", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query("SELECT * FROM orders WHERE id=$1", [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (!order.tracking_number) {
      return res.status(400).json({ error: "Order has no tracking number" });
    }

    // Get tracking details from Shiprocket
    const trackingData = await shiprocket.getTrackingDetails(order.tracking_number);

    if (trackingData.tracking_data && trackingData.tracking_data.shipment_track) {
      const track = trackingData.tracking_data.shipment_track;
      
      // Update tracking history
      for (const event of track.events || []) {
        await pool.query(
          `INSERT INTO tracking_history (order_id, tracking_number, status, location, timestamp, additional_info)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [id, order.tracking_number, event.status, event.location, event.timestamp, JSON.stringify(event)]
        );
      }

      // Update estimated/actual delivery dates
      const estimatedDelivery = track.estimated_delivery_date;
      const actualDelivery = track.delivered_date;
      const currentStatus = track.status;

      await pool.query(
        `UPDATE orders 
         SET estimated_delivery_date=$1, actual_delivery_date=$2, shiprocket_status=$3
         WHERE id=$4`,
        [estimatedDelivery || null, actualDelivery || null, currentStatus, id]
      );

      res.json({
        message: "Tracking synchronized",
        tracking: {
          status: currentStatus,
          estimated_delivery: estimatedDelivery,
          actual_delivery: actualDelivery,
          events: track.events
        }
      });
    } else {
      res.status(400).json({ error: "No tracking data found", details: trackingData });
    }
  } catch (err) {
    console.error("Tracking sync error:", err);
    res.status(500).json({ error: err.message });
  }
});

// List available couriers for an order
router.post("/:id/available-couriers", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query(
      `SELECT o.*, oi.product_id, oi.quantity, p.weight
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.id=$1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];
    const shippingInfo = typeof order.shipping_info === 'string' ? JSON.parse(order.shipping_info) : order.shipping_info;

    // Calculate weight
    let totalWeight = 0;
    for (const item of orderResult.rows) {
      totalWeight += (item.weight || 0.5) * item.quantity;
    }

    // Check service availability
    const serviceability = await shiprocket.verifyServiceability(
      process.env.SHIPROCKET_WAREHOUSE_PINCODE || '110001',
      shippingInfo.zipcode,
      totalWeight
    );

    res.json({
      available_couriers: serviceability.available_courier_companies || [],
      serviceability_details: serviceability
    });
  } catch (err) {
    console.error("Available couriers error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Generate shipping label
router.post("/:id/generate-label", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query("SELECT * FROM orders WHERE id=$1", [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (!order.shiprocket_shipment_id) {
      return res.status(400).json({ error: "Shipment not created yet" });
    }

    // Generate label
    const labelResponse = await shiprocket.generateLabel([order.shiprocket_shipment_id]);

    res.json({
      message: "Label generated",
      label_url: labelResponse.label_url || labelResponse.labels,
      details: labelResponse
    });
  } catch (err) {
    console.error("Generate label error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Cancel Shiprocket shipment
router.post("/:id/cancel-shipment", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query("SELECT * FROM orders WHERE id=$1", [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (!order.shiprocket_shipment_id) {
      return res.status(400).json({ error: "Shipment not created yet" });
    }

    // Cancel shipment
    const cancelResponse = await shiprocket.cancelShipment(order.shiprocket_shipment_id);

    // Update order status
    await pool.query(
      "UPDATE orders SET status=$1, shiprocket_status=$2 WHERE id=$3",
      ['cancelled', 'cancelled', id]
    );

    res.json({
      message: "Shipment cancelled",
      response: cancelResponse
    });
  } catch (err) {
    console.error("Cancel shipment error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
