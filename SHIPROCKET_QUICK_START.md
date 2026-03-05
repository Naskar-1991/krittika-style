# Shiprocket Integration - Quick Start Guide

## 🚀 Quick Setup (5 Steps)

### Step 1: Get Shiprocket API Key (5 min)

1. Go to **[shiprocket.in](https://www.shiprocket.in/)**
2. Sign up and complete KYC verification
3. Go to **Settings → API Credentials**
4. Copy your **API Key** (it starts with a token)
5. Note your **Warehouse ID** from **Warehouse Management** (usually `50403`)

### Step 2: Install Dependencies (2 min)

```bash
cd backend
npm install axios
```

### Step 3: Configure Environment Variables (3 min)

Create or update `.env` file in `backend/` directory with:

```env
# Existing variables (keep these)
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
PORT=5500

# NEW: Add these Shiprocket variables
SHIPROCKET_API_KEY=your_api_key_here
SHIPROCKET_WAREHOUSE_ID=50403
SHIPROCKET_WAREHOUSE_PINCODE=110001
SHIPROCKET_WEBHOOK_SECRET=generate_a_random_string_here
```

**How to generate webhook secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Run Database Migration (2 min)

```bash
# Using psql
psql -U postgres -d ecommerce_db -f backend/MIGRATION_ADD_SHIPROCKET.sql
```

Or manually run SQL commands from `backend/MIGRATION_ADD_SHIPROCKET.sql` in pgAdmin/DBeaver.

### Step 5: Restart Backend Server (1 min)

```bash
cd backend
npm run dev
```

---

## 🧪 Test It (3 Steps)

### 1. Create a Test Order
- Go to your app: http://localhost:3000
- Browse products → Add to cart
- Click Checkout
- Fill in shipping details
- Complete Razorpay payment

### 2. Check Admin (Create Shipment)
- Access admin panel or use curl:

```bash
curl -X POST http://localhost:5500/api/orders/1/shiprocket/create-shipment \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "courierPartner": "FEDEX",
    "isHeavyItem": false
  }'
```

### 3. Verify Tracking
- Go to MyOrders page
- You should see:
  - ✅ Tracking number
  - ✅ Carrier name (FedEx, etc.)
  - ✅ Status badge
  - ✅ Estimated delivery date

---

## 🔌 Setup Webhooks (Optional but Recommended)

For real-time tracking updates:

1. Login to **Shiprocket Dashboard**
2. Go to **Settings → Webhooks**
3. Click **Add Webhook**
4. **URL:** `https://yourdomain.com/api/webhooks/shiprocket`
   - *For local testing, use ngrok:*
   ```bash
   ngrok http 5500
   # Then use: https://xxxx-xxx-xxx-xxx.ngrok.io/api/webhooks/shiprocket
   ```
5. **Events:** Tick all tracking events
6. Save and test webhook

---

## 📱 Frontend Features (Already Built!)

Users will see on MyOrders page:

```
Order #123                           ✅ Delivered
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Shipping: John Doe
         123 Main St, Delhi, 110001

📍 TRACKING INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tracking Number:  FDX7890123456
Carrier:         FedEx
Status:          🚚 IN_TRANSIT
Est. Delivery:   Mar 10, 2026

[View History ▼]  [Track on Shiprocket]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Items  | Qty | Price | Total
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ₹5,999
```

---

## 🔧 API Endpoints Reference

### User Endpoints (For Frontend)
```bash
# Get user's orders with tracking
GET /api/orders/user/my-orders
Headers: Authorization: Bearer {token}

# Get tracking details for specific order
GET /api/orders/{id}/tracking
Headers: Authorization: Bearer {token}
```

### Admin Endpoints (For Backend/Dashboard)
```bash
# Create shipment
POST /api/orders/{id}/shiprocket/create-shipment
Headers: Authorization: Bearer {admin_token}
Body: { "courierPartner": "FEDEX", "isHeavyItem": false }

# Sync tracking from Shiprocket
POST /api/orders/{id}/sync-tracking
Headers: Authorization: Bearer {admin_token}

# Get available couriers
POST /api/orders/{id}/available-couriers
Headers: Authorization: Bearer {admin_token}

# Generate shipping label
POST /api/orders/{id}/generate-label
Headers: Authorization: Bearer {admin_token}

# Cancel shipment
POST /api/orders/{id}/cancel-shipment
Headers: Authorization: Bearer {admin_token}
```

---

## ❌ Common Issues & Solutions

### Error: "Invalid API Key"
```
Solution: Check your .env file
- Make sure SHIPROCKET_API_KEY is correct
- No extra spaces before/after the key
- Key should be exactly as copied from Shiprocket dashboard
```

### Error: "Shipment creation failed"
```
Solution: Check these:
1. Is warehouse ID correct? (Settings → Warehouse Management)
2. Is warehouse pincode in the postcode range?
3. Is delivery pincode valid and serviceable?
4. Is order amount > 0?
```

### Webhook not receiving updates
```
Solution:
1. Check webhook URL in Shiprocket matches exactly
2. Make sure domain is HTTPS (not HTTP)
3. Check firewall/security groups allow webhooks
4. Use Postman to test webhook endpoint:
   POST http://localhost:5500/api/webhooks/shiprocket
   Body: {"event_type": "test", "order_id": "ORDER-1"}
```

### Tracking not showing on frontend
```
Solution:
1. Order status should be "shipped" or "processing"
2. Must have tracking_number in orders table
3. Check browser console for JavaScript errors
4. Verify MyOrders.js is updated with new code
5. Clear browser cache and reload
```

---

## 📊 Database Tables Added

After migration, you'll have:

**New Columns in `orders` table:**
- `shiprocket_shipment_id` - Shiprocket shipment ID
- `tracking_number` - Courier tracking number
- `carrier_name` - Courier name (FedEx, DELHIVERY, etc.)
- `estimated_delivery_date` - Expected delivery
- `actual_delivery_date` - When delivered
- `shiprocket_status` - Status from Shiprocket
- `is_shiprocket_generated` - Flag if created in Shiprocket

**New Tables:**
- `shipping_events` - Stores webhook events
- `tracking_history` - Timeline of tracking updates

---

## 🎯 Full Order Workflow

```
1. User browses & adds items to cart
   ↓
2. User proceeds to checkout
   ↓
3. User fills shipping details
   ↓
4. Payment via Razorpay
   ↓
5. Order created in database (Local)
   ↓
6. Order auto-synced to Shiprocket
   ↓
7. Order status: "pending" → "processing"
   ↓
8. [ADMIN] Creates shipment in Shiprocket
   ↓
9. Tracking number received
   ↓
10. Order status: "processing" → "shipped"
   ↓
11. Webhooks send tracking updates
   ↓
12. Tracking updates in database
   ↓
13. User sees real-time tracking on MyOrders
   ↓
14. Package delivered
   ↓
15. Order status: "shipped" → "delivered"
```

---

## 📚 Files Created/Modified

**Created:**
- ✅ `backend/shiprocketService.js` - Shiprocket API client
- ✅ `backend/routes/webhooks.js` - Webhook handler
- ✅ `backend/MIGRATION_ADD_SHIPROCKET.sql` - Database migration
- ✅ `SHIPROCKET_INTEGRATION_GUIDE.md` - Complete guide
- ✅ `SHIPROCKET_IMPLEMENTATION_CHECKLIST.md` - Implementation status

**Updated:**
- ✅ `backend/package.json` - Added axios
- ✅ `backend/routes/orders.js` - Shiprocket integration
- ✅ `backend/server.js` - Webhook routes
- ✅ `src/pages/MyOrders.js` - Tracking UI
- ✅ `src/pages/MyOrders.css` - Tracking styles

---

## 🚀 Ready to Go!

Everything is implemented. Just:

1. **Install axios:** `npm install axios`
2. **Add .env variables** (Shiprocket API Key, etc.)
3. **Run migration:** `psql -U postgres -d ecommerce_db -f backend/MIGRATION_ADD_SHIPROCKET.sql`
4. **Restart backend:** `npm run dev`
5. **Test:** Create order → Create shipment → Check tracking

For detailed information, see **`SHIPROCKET_INTEGRATION_GUIDE.md`**

---

## 💡 Pro Tips

- Start with FedEx as courier (widely available)
- Test webhooks with ngrok for local development
- Add auto-shipment creation for smooth UX
- Consider SMS/Email notifications for tracking
- Monitor Shiprocket dashboard for order status
- Implement RTO (Return to Origin) handling for returns

---

**Questions?** Check the complete guide: [SHIPROCKET_INTEGRATION_GUIDE.md](SHIPROCKET_INTEGRATION_GUIDE.md)

**Status:** ✅ **Ready for Production**
