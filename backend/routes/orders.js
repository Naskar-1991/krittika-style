const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const ShiprocketClient = require("../shiprocketService");

const SECRET = process.env.JWT_SECRET || "supersecret";

// Use global shiprocket instance (initialized in server.js)
const getShiprocket = () => {
  if (!global.shiprocket) {
    throw new Error('Shiprocket client not initialized. Check server startup logs.');
  }
  return global.shiprocket;
};

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
          name: product.name || "",
          sku: product.id,
          units: parseInt(item.quantity || 1),
          selling_price: parseFloat(item.price || 0),
          discount: 0,
          tax: 0,
          hsn_code: product.hsn_code || ""
        });
      }
    }

    // Prepare Shiprocket order data with strict validation
    const customerName = user.name || (shippingInfo.firstName && shippingInfo.lastName ? `${shippingInfo.firstName} ${shippingInfo.lastName}` : "Customer");
    
    // Log raw input data for debugging
    console.log('📦 CHECKOUT DATA RECEIVED:', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      shippingInfo: shippingInfo
    });

    // Sanitize and validate phone number (must be digits only, 10 digits without country code)
    const cleanPhone = (phoneStr) => {
      const cleaned = (phoneStr || "").toString().replace(/\D/g, ''); // Remove all non-numeric chars
      
      // Handle different Indian phone formats:
      // 919876543210 (12 digits with country code 91) → 9876543210
      // 07586826861 (11 digits with leading 0) → 7586826861
      let finalPhone = cleaned;
      
      // Remove country code if present (91 at start)
      if (finalPhone.length === 12 && finalPhone.startsWith('91')) {
        finalPhone = finalPhone.slice(2); // Remove leading 91, now 10 digits
      }
      
      // Remove leading 0 if present (for landlines) - 0 followed by 10 digits becomes 10 digits
      if (finalPhone.length === 11 && finalPhone.startsWith('0')) {
        finalPhone = finalPhone.slice(1); // Remove leading 0
      }
      
      // Final validation: must be exactly 10 digits
      return finalPhone.length === 10 ? finalPhone : "";
    };

    // Validate pincode (must be digits, ideally 6 for India)
    const cleanPincode = (pincodeStr) => {
      const cleaned = (pincodeStr || "").toString().replace(/\D/g, '');
      return cleaned.length >= 5 ? cleaned : ""; // Accept 5-6 digit pincodes
    };

    // Validate address - ensure non-empty
    const cleanAddress = (addressStr) => {
      return (addressStr || "").trim();
    };

    // Map full state names to state codes (Shiprocket requires state codes)
    const stateMap = {
      'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', 'Assam': 'AS', 'Bihar': 'BR',
      'Chhattisgarh': 'CG', 'Goa': 'GA', 'Gujarat': 'GJ', 'Haryana': 'HR',
      'Himachal Pradesh': 'HP', 'Jharkhand': 'JH', 'Karnataka': 'KA', 'Kerala': 'KL',
      'Madhya Pradesh': 'MP', 'Maharashtra': 'MH', 'Manipur': 'MN', 'Meghalaya': 'ML',
      'Mizoram': 'MZ', 'Nagaland': 'NL', 'Odisha': 'OR', 'Punjab': 'PB',
      'Rajasthan': 'RJ', 'Sikkim': 'SK', 'Tamil Nadu': 'TN', 'Telangana': 'TG',
      'Tripura': 'TR', 'Uttar Pradesh': 'UP', 'Uttarakhand': 'UT', 'West Bengal': 'WB',
      'Dadra and Nagar Haveli': 'DN', 'Daman and Diu': 'DD', 'Lakshadweep': 'LD',
      'Puducherry': 'PY', 'Andaman and Nicobar': 'AN', 'Chandigarh': 'CH',
      'Delhi': 'DL', 'Ladakh': 'LA', 'Jammu and Kashmir': 'JK'
    };

    // Convert state name to code if needed
    const getStateCode = (stateInput) => {
      if (!stateInput) return "";
      const trimmed = stateInput.trim();
      // If it's already a code (2 letters), return as is
      if (trimmed.length === 2 && /^[A-Z]{2}$/.test(trimmed)) {
        return trimmed;
      }
      // Otherwise, look up in map
      return stateMap[trimmed] || trimmed; // Return code or original if not found
    };

    const billingPhone = cleanPhone(user.phone || shippingInfo.phone);
    const billingPincode = cleanPincode(shippingInfo.zipcode);
    const billingState = getStateCode(shippingInfo.state); // Convert to state code
    const shippingState = billingState; // Same state for shipping
    const billingAddress = cleanAddress(shippingInfo.address);
    const billingCity = (shippingInfo.city || "").trim();

    // Log phone cleaning for debugging
    const rawPhone = user.phone || shippingInfo.phone;
    if (rawPhone && rawPhone !== billingPhone) {
      console.log(`📞 Phone cleaned: "${rawPhone}" → "${billingPhone}"`);
    }

    // Log state code conversion
    const rawState = shippingInfo.state;
    if (rawState && rawState !== billingState) {
      console.log(`🏷️  State converted: "${rawState}" → "${billingState}"`);
    }

    // Validate all required fields BEFORE creating Shiprocket order
    const validationErrors = [];
    if (!customerName || customerName === "Customer") {
      validationErrors.push(`❌ Customer name: "${customerName}" (user.name: "${user.name}", firstName: "${shippingInfo.firstName}", lastName: "${shippingInfo.lastName}")`);
    } else {
      console.log(`✅ Customer name: "${customerName}"`);
    }
    if (!billingAddress) {
      validationErrors.push(`❌ Address: empty (input: "${shippingInfo.address}", cleaned: "${billingAddress}")`);
    } else {
      console.log(`✅ Address: "${billingAddress}"`);
    }
    if (!billingCity) {
      validationErrors.push(`❌ City: empty (input: "${shippingInfo.city}")`);
    } else {
      console.log(`✅ City: "${billingCity}"`);
    }
    if (!billingState) {
      validationErrors.push(`❌ State: invalid (input: "${shippingInfo.state}", code: "${billingState}" - state not found in map)`);
    } else {
      console.log(`✅ State: "${billingState}" (code for "${shippingInfo.state}")`);
    }
    if (!billingPincode) {
      validationErrors.push(`❌ Pincode: invalid (input: "${shippingInfo.zipcode}", cleaned: "${billingPincode}")`);
    } else {
      console.log(`✅ Pincode: "${billingPincode}"`);
    }
    if (!billingPhone) {
      validationErrors.push(`❌ Phone: invalid (user.phone: "${user.phone}", shippingInfo.phone: "${shippingInfo.phone}", cleaned: "${billingPhone}" - must be exactly 10 digits, without country code)`);
    } else {
      console.log(`✅ Phone: "${billingPhone}" (cleaned from raw value)`);
    }

    // Log validation results
    console.log(`🔍 VALIDATION CHECK - Errors: ${validationErrors.length}`);
    if (validationErrors.length > 0) {
      console.error('❌ SHIPROCKET VALIDATION FAILED:');
      validationErrors.forEach(error => console.error(`   - ${error}`));
      console.log('📝 Cleaned Data:', {
        customerName,
        billingAddress,
        billingCity,
        billingState,
        billingPincode,
        billingPhone
      });
    } else {
      console.log('✅ All validation checks passed!');
    }

    const shiprocketOrderData = {
      order_id: `ORDER-${order.id}`,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location_name: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
      billing_customer_name: customerName || '',
      billing_email: user.email || shippingInfo.email || "default@example.com",
      billing_phone: billingPhone || '',
      billing_address: billingAddress || '',
      billing_city: billingCity || '',
      billing_state: billingState || '',
      billing_country: (shippingInfo.country || "India").trim() || 'India',
      billing_pincode: billingPincode || '',
      order_items: orderItems || [],
      sub_total: parseFloat(totalAmount || 0),
      length: 10,
      breadth: 10,
      height: 10,
      weight: parseFloat(totalWeight || 1)
    };

    console.log('\n📦 FINAL SHIPROCKET ORDER DATA:');
    console.log(JSON.stringify({
      order_id: shiprocketOrderData.order_id,
      billing_customer_name: shiprocketOrderData.billing_customer_name,
      billing_phone: shiprocketOrderData.billing_phone,
      billing_address: shiprocketOrderData.billing_address,
      billing_city: shiprocketOrderData.billing_city,
      billing_state: shiprocketOrderData.billing_state,
      billing_pincode: shiprocketOrderData.billing_pincode,
      shipping_phone: shiprocketOrderData.shipping_phone,
      shipping_address: shiprocketOrderData.shipping_address,
      shipping_city: shiprocketOrderData.shipping_city,
      shipping_state: shiprocketOrderData.shipping_state,
      shipping_pincode: shiprocketOrderData.shipping_pincode
    }, null, 2));

    // Additional check: Ensure address fields are NOT empty before sending to Shiprocket
    const hasCompleteAddress =
      shiprocketOrderData.billing_address && shiprocketOrderData.billing_address.trim() !== '' &&
      shiprocketOrderData.billing_city && shiprocketOrderData.billing_city.trim() !== '' &&
      shiprocketOrderData.billing_state && shiprocketOrderData.billing_state.trim() !== '' &&
      shiprocketOrderData.billing_pincode && shiprocketOrderData.billing_pincode.trim() !== '';

    if (!hasCompleteAddress) {
      console.warn('⏭️  SKIPPING SHIPROCKET - Incomplete address information');
      console.warn('Missing address fields:', {
        billing_address: shiprocketOrderData.billing_address || 'MISSING',
        billing_city: shiprocketOrderData.billing_city || 'MISSING',
        billing_state: shiprocketOrderData.billing_state || 'MISSING',
        billing_pincode: shiprocketOrderData.billing_pincode || 'MISSING',
        shipping_address: shiprocketOrderData.shipping_address || 'MISSING',
        shipping_city: shiprocketOrderData.shipping_city || 'MISSING',
        shipping_state: shiprocketOrderData.shipping_state || 'MISSING',
        shipping_pincode: shiprocketOrderData.shipping_pincode || 'MISSING'
      });
    }

    // Try to create order in Shiprocket only if validation passes AND address is complete
    if (validationErrors.length === 0 && hasCompleteAddress) {
      try {
        console.log('📤 Sending valid order to Shiprocket...');
        const shiprocketResponse = await getShiprocket().createOrder(shiprocketOrderData);
        console.log('✅ Shiprocket Order Created:', shiprocketResponse);
        
        // Save Shiprocket order ID so we can cancel it later
        if (shiprocketResponse.order_id) {
          await pool.query(
            "UPDATE orders SET is_shiprocket_generated=$1, shiprocket_order_id=$2 WHERE id=$3",
            [true, shiprocketResponse.order_id, order.id]
          );
          console.log(`✅ Shiprocket order_id ${shiprocketResponse.order_id} saved for local order ${order.id}`);
        }
      } catch (shiprocketError) {
        console.error('❌ SHIPROCKET API ERROR:', {
          message: shiprocketError.message,
          status: shiprocketError.response?.status,
          shiprocketMessage: shiprocketError.response?.data?.message,
          shiprocketDetails: shiprocketError.response?.data,
          sentPayload: shiprocketOrderData
        });
        console.warn('⚠️  Order created locally, but Shiprocket sync failed:', shiprocketError.message);
        // Continue without blocking - user's order is still created locally
      }
    } else {
      if (validationErrors.length > 0) {
        console.warn('⏭️  SKIPPING SHIPROCKET - Validation errors found');
        console.warn('User will need to update their shipping information to enable Shiprocket tracking');
      }
      console.log('ℹ️  Order created locally. Shiprocket sync will be attempted when address is updated.');
    }

    // Log successful order creation
    console.log(`Order ${order.id} created by user ${req.user.id}`);

    // Prepare response based on Shiprocket status
    const shiprocketStatus = validationErrors.length === 0 && hasCompleteAddress ? 'synced' : 'local-only';
    const responseMessage = shiprocketStatus === 'synced' 
      ? "Order created successfully with Shiprocket tracking"
      : "Order created. Shipping tracking will be available once address is confirmed.";

    res.status(201).json({ 
      message: responseMessage,
      shiprocketStatus: shiprocketStatus,
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

// Get user's orders (authenticated user) - MUST come before /:id route
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

// Get order by ID (admin or order owner)
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get order with all details including payment and shipping info
    const orderResult = await pool.query(
      `SELECT o.id, o.user_id, o.status, o.total_amount, o.created_at,
              o.shipping_info, o.payment_status, o.payment_method, o.payment_date,
              o.razorpay_order_id, o.razorpay_payment_id, o.razorpay_signature,
              o.shiprocket_shipment_id, o.tracking_number, o.carrier_name,
              o.estimated_delivery_date, o.shiprocket_status, o.tracking_url,
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
    const shipmentResponse = await getShiprocket().createShipment(shipmentData);
    
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

    // Base tracking info from DB
    const trackingInfo = {
      tracking_number: order.tracking_number,
      carrier_name: order.carrier_name,
      shiprocket_status: order.shiprocket_status,
      estimated_delivery_date: order.estimated_delivery_date,
      actual_delivery_date: order.actual_delivery_date,
      tracking_url: order.tracking_url
    };

    // Get stored tracking history
    const historyResult = await pool.query(
      `SELECT status, location, timestamp, additional_info
       FROM tracking_history
       WHERE order_id=$1
       ORDER BY timestamp DESC`,
      [id]
    );

    let liveTracking = null;

    // Fetch live tracking data from Shiprocket if tracking number is available
    if (order.tracking_number) {
      try {
        const shiprocket = getShiprocket();
        const trackingData = await shiprocket.getTrackingDetails(order.tracking_number);

        if (trackingData && trackingData.tracking_data) {
          const td = trackingData.tracking_data;
          const shipmentTrack = td.shipment_track && td.shipment_track.length > 0
            ? td.shipment_track[0]
            : null;
          const activities = td.shipment_track_activities || [];

          liveTracking = {
            current_status: shipmentTrack?.current_status || null,
            delivered_to: shipmentTrack?.delivered_to || null,
            destination: shipmentTrack?.destination || null,
            origin: shipmentTrack?.origin || null,
            courier_name: shipmentTrack?.courier_company_id || null,
            edd: shipmentTrack?.edd || null,
            activities: activities.map(a => ({
              date: a.date,
              status: a.status,
              activity: a.activity,
              location: a.location
            }))
          };

          // Persist updated status back to DB if it changed
          if (shipmentTrack?.current_status && shipmentTrack.current_status !== order.shiprocket_status) {
            await pool.query(
              `UPDATE orders SET shiprocket_status=$1 WHERE id=$2`,
              [shipmentTrack.current_status, id]
            );
            trackingInfo.shiprocket_status = shipmentTrack.current_status;
          }
        }
      } catch (shiprocketErr) {
        // Non-fatal — fall back to DB data
        console.warn("Live Shiprocket tracking fetch failed:", shiprocketErr.message);
      }
    }

    res.json({
      order: {
        id: order.id,
        status: order.status,
        created_at: order.created_at,
        shipping_info: order.shipping_info,
        ...trackingInfo
      },
      history: historyResult.rows,
      liveTracking
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
    const trackingData = await getShiprocket().getTrackingDetails(order.tracking_number);

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
    const serviceability = await getShiprocket().verifyServiceability(
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
    const labelResponse = await getShiprocket().generateLabel([order.shiprocket_shipment_id]);

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

// Cancel order (order owner — only pending/processing)
router.post("/:id/cancel", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query(
      `SELECT id, user_id, status, total_amount,
              shiprocket_order_id, shiprocket_shipment_id, tracking_number
       FROM orders WHERE id=$1`,
      [id]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (parseInt(order.user_id) !== parseInt(req.user.id)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!["pending", "processing"].includes(order.status)) {
      return res.status(400).json({
        error: `Cannot cancel this order. Orders with status "${order.status}" cannot be cancelled.`
      });
    }

    const shiprocket = getShiprocket();
    let shiprocketOrderId = order.shiprocket_order_id
      ? parseInt(order.shiprocket_order_id)
      : null;

    // ── Step 1: if we don't have the Shiprocket order ID yet, look it up ──
    if (!shiprocketOrderId) {
      try {
        const channelOrderId = `ORDER-${id}`;
        const srOrder = await shiprocket.getOrderByChannelId(channelOrderId);
        if (srOrder && srOrder.id) {
          shiprocketOrderId = srOrder.id;
          // Persist so future calls skip this lookup
          await pool.query(
            "UPDATE orders SET shiprocket_order_id=$1 WHERE id=$2",
            [shiprocketOrderId, id]
          );
          console.log(`✅ Resolved & saved shiprocket_order_id=${shiprocketOrderId} for local order ${id}`);
        }
      } catch (lookupErr) {
        console.warn(`⚠️  Could not look up Shiprocket order for local order ${id}:`, lookupErr.message);
      }
    }

    // ── Step 2: cancel in Shiprocket ──
    let shiprocketCancelled = false;
    let shiprocketError = null;

    if (shiprocketOrderId) {
      try {
        const cancelResult = await shiprocket.cancelOrder(shiprocketOrderId);
        console.log(`✅ Shiprocket order ${shiprocketOrderId} cancelled:`, cancelResult);
        shiprocketCancelled = true;
      } catch (err) {
        shiprocketError = err.response?.data?.message || err.message;
        console.error(`❌ Shiprocket cancelOrder failed (id=${shiprocketOrderId}):`, shiprocketError);
      }
    } else if (order.tracking_number) {
      // Fallback: cancel by AWB if order was already assigned one
      try {
        const cancelResult = await shiprocket.cancelShipmentByAWB(order.tracking_number);
        console.log(`✅ Shiprocket AWB ${order.tracking_number} cancelled:`, cancelResult);
        shiprocketCancelled = true;
      } catch (err) {
        shiprocketError = err.response?.data?.message || err.message;
        console.error(`❌ Shiprocket AWB cancel failed (${order.tracking_number}):`, shiprocketError);
      }
    } else {
      console.log(`ℹ️  Order ${id} not found in Shiprocket — local cancel only`);
    }

    // ── Step 3: verify cancellation status from Shiprocket ──
    let verifiedShiprocketStatus = null;
    if (shiprocketCancelled && shiprocketOrderId) {
      try {
        const statusData = await shiprocket.getOrderStatus(shiprocketOrderId);
        verifiedShiprocketStatus = statusData?.status || statusData?.data?.status || null;
        console.log(`📋 Shiprocket order ${shiprocketOrderId} verified status: ${verifiedShiprocketStatus}`);
      } catch (verifyErr) {
        console.warn(`⚠️  Could not verify Shiprocket status:`, verifyErr.message);
      }
    }

    // ── Step 4: update local DB ──
    const dbResult = await pool.query(
      `UPDATE orders
       SET status          = 'cancelled',
           shiprocket_status = CASE
             WHEN $2 IS NOT NULL THEN $2
             WHEN $3 = true      THEN 'CANCELED'
             ELSE shiprocket_status
           END
       WHERE id = $1
       RETURNING id, status, total_amount, created_at`,
      [id, verifiedShiprocketStatus, shiprocketCancelled]
    );

    console.log(`Order ${id} cancelled by user ${req.user.id}. Shiprocket cancelled: ${shiprocketCancelled}`);
    res.json({
      message: "Order cancelled successfully",
      shiprocketCancelled,
      shiprocketStatus: verifiedShiprocketStatus,
      shiprocketError: shiprocketCancelled ? null : (shiprocketOrderId || order.tracking_number ? shiprocketError : null),
      order: dbResult.rows[0]
    });
  } catch (err) {
    console.error("Order cancel error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Cancel Shiprocket shipment (admin)
router.post("/:id/cancel-shipment", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query(
      "SELECT id, status, shiprocket_order_id, shiprocket_shipment_id, tracking_number FROM orders WHERE id=$1",
      [id]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];
    const shiprocket = getShiprocket();

    let shiprocketOrderId = order.shiprocket_order_id ? parseInt(order.shiprocket_order_id) : null;

    // Look up Shiprocket order ID if not stored
    if (!shiprocketOrderId) {
      try {
        const srOrder = await shiprocket.getOrderByChannelId(`ORDER-${id}`);
        if (srOrder?.id) {
          shiprocketOrderId = srOrder.id;
          await pool.query("UPDATE orders SET shiprocket_order_id=$1 WHERE id=$2", [shiprocketOrderId, id]);
        }
      } catch (lookupErr) {
        console.warn(`⚠️  Could not look up Shiprocket order for local order ${id}:`, lookupErr.message);
      }
    }

    let shiprocketCancelled = false;
    let shiprocketError = null;

    if (shiprocketOrderId) {
      try {
        const cancelResponse = await shiprocket.cancelOrder(shiprocketOrderId);
        console.log(`✅ Shiprocket order ${shiprocketOrderId} cancelled:`, cancelResponse);
        shiprocketCancelled = true;
      } catch (err) {
        shiprocketError = err.response?.data?.message || err.message;
        console.error(`❌ Shiprocket cancelOrder failed (id=${shiprocketOrderId}):`, shiprocketError);
      }
    } else if (order.tracking_number) {
      try {
        const cancelResponse = await shiprocket.cancelShipmentByAWB(order.tracking_number);
        console.log(`✅ Shiprocket AWB ${order.tracking_number} cancelled:`, cancelResponse);
        shiprocketCancelled = true;
      } catch (err) {
        shiprocketError = err.response?.data?.message || err.message;
        console.error(`❌ Shiprocket AWB cancel failed:`, shiprocketError);
      }
    }

    await pool.query(
      "UPDATE orders SET status='cancelled', shiprocket_status=CASE WHEN $2 = true THEN 'CANCELED' ELSE shiprocket_status END WHERE id=$1",
      [id, shiprocketCancelled]
    );

    res.json({
      message: shiprocketCancelled ? "Shipment cancelled in Shiprocket and locally" : "Order cancelled locally (Shiprocket sync failed)",
      shiprocketCancelled,
      shiprocketError: shiprocketCancelled ? null : shiprocketError
    });
  } catch (err) {
    console.error("Cancel shipment error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
