# Shiprocket Integration Guide

This document provides complete instructions for integrating Shiprocket shipping and delivery tracking into the ecommerce application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Shiprocket Account Setup](#shiprocket-account-setup)
3. [Backend Configuration](#backend-configuration)
4. [Database Migration](#database-migration)
5. [API Endpoints](#api-endpoints)
6. [Webhook Configuration](#webhook-configuration)
7. [Frontend Integration](#frontend-integration)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)

---

## Prerequisites

- Shiprocket Account (Business or Pro plan recommended)
- Node.js backend running on port 5500 (or configured port)
- PostgreSQL database with existing orders table
- Frontend React application
- HTTPS enabled for production (required for webhooks)

---

## Shiprocket Account Setup

### 1. Create Shiprocket Account
1. Go to [Shiprocket.in](https://www.shiprocket.in/)
2. Sign up for an account
3. Complete KYC (Know Your Customer) verification
4. Choose a plan (Pro plan recommended for API access)

### 2. Get API Credentials

1. Login to Shiprocket dashboard
2. Navigate to **Settings → API Credentials**
3. Copy your **API Key** (Bearer token)
4. Save this securely - you'll need it next

### 3. Setup Warehouse Location

1. Go to **Settings → Warehouse Management**
2. Add your pickup location/warehouse
3. Note down the **Warehouse ID** (e.g., 50403)
4. This will be used as the default pickup location for all shipments

---

## Backend Configuration

### 1. Install Dependencies

```bash
cd backend
npm install axios
```

### 2. Environment Variables

Add these variables to your `.env` file in the backend directory:

```env
# ==================== SHIPROCKET CREDENTIALS ====================
SHIPROCKET_API_KEY=your_api_key_here
SHIPROCKET_WAREHOUSE_ID=50403
SHIPROCKET_WAREHOUSE_PINCODE=110001
SHIPROCKET_WEBHOOK_SECRET=your_webhook_secret_here

# ==================== APPLICATION CONFIG ====================
JWT_SECRET=your_jwt_secret_here
PORT=5500
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce

# ==================== PAYMENT ====================
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# ==================== SHIPPING ====================
SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in/v1/external
```

### Example .env file structure:
```env
# Server Configuration
PORT=5500
JWT_SECRET=supersecret_jwt_key_12345

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce_db

# Shiprocket
SHIPROCKET_API_KEY=Bearer_your_actual_api_key_here
SHIPROCKET_WAREHOUSE_ID=50403
SHIPROCKET_WAREHOUSE_PINCODE=110001
SHIPROCKET_WEBHOOK_SECRET=your_webhook_signature_secret

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret
```

---

## Database Migration

### 1. Run Migration SQL

Execute the migration file to add Shiprocket-related columns:

```bash
# Using psql
psql -U postgres -d ecommerce_db -f backend/MIGRATION_ADD_SHIPROCKET.sql

# Or using your database client, run the SQL commands from:
# backend/MIGRATION_ADD_SHIPROCKET.sql
```

### 2. Verify New Tables

Check that new columns were added to `orders` table:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'orders';
```

New columns added:
- `shiprocket_shipment_id` - Shiprocket shipment ID
- `tracking_number` - Courier tracking number
- `carrier_name` - Courier company name
- `estimated_delivery_date` - Expected delivery date
- `actual_delivery_date` - Actual delivery date
- `shiprocket_status` - Status from Shiprocket (pickup_pending, in_transit, etc.)
- `tracking_url` - Direct tracking URL
- `is_shiprocket_generated` - Flag if order was created in Shiprocket

New tables created:
- `shipping_events` - Store webhook events from Shiprocket
- `tracking_history` - Store tracking history for each shipment

---

## API Endpoints

### Create Shipment for Order
```
POST /api/orders/:id/shiprocket/create-shipment
Authorization: Bearer {user_token}
Admin Only!

Request Body:
{
  "courierPartner": "FEDEX",
  "isHeavyItem": false
}

Response:
{
  "message": "Shipment created successfully",
  "shipment": {
    "shipment_id": 123456789,
    "tracking_number": "FDX7890123456",
    "status": "pickup_pending"
  }
}
```

### Get Tracking Information
```
GET /api/orders/:id/tracking
Authorization: Bearer {user_token}

Response:
{
  "order": {
    "id": 1,
    "status": "shipped",
    "tracking_number": "FDX7890123456",
    "carrier_name": "FedEx",
    "shiprocket_status": "in_transit",
    "estimated_delivery_date": "2026-03-10",
    "actual_delivery_date": null,
    "tracking_url": "https://www.shiprocket.in/tracking/FDX7890123456/"
  },
  "history": [
    {
      "status": "picked_up",
      "location": "Delhi Warehouse",
      "timestamp": "2026-03-05T10:00:00Z"
    }
  ]
}
```

### Sync Tracking from Shiprocket
```
POST /api/orders/:id/sync-tracking
Authorization: Bearer {user_token}
Admin Only!

Response:
{
  "message": "Tracking synchronized",
  "tracking": {
    "status": "in_transit",
    "estimated_delivery": "2026-03-10",
    "events": [...]
  }
}
```

### Available Couriers
```
POST /api/orders/:id/available-couriers
Authorization: Bearer {user_token}
Admin Only!

Response:
{
  "available_couriers": [
    {
      "courier_id": 1,
      "courier_name": "FedEx",
      "estimated_delivery": "2026-03-10"
    }
  ]
}
```

### Generate Shipping Label
```
POST /api/orders/:id/generate-label
Authorization: Bearer {user_token}
Admin Only!

Response:
{
  "message": "Label generated",
  "label_url": "https://cdn.shiprocket.in/...",
  "details": {...}
}
```

### Cancel Shipment
```
POST /api/orders/:id/cancel-shipment
Authorization: Bearer {user_token}
Admin Only!

Response:
{
  "message": "Shipment cancelled",
  "response": {...}
}
```

---

## Webhook Configuration

### Setup Webhook in Shiprocket Dashboard

1. Login to Shiprocket
2. Go to **Settings → Webhooks**
3. Add new webhook with these settings:

**URL:** `https://your-domain.com/api/webhooks/shiprocket`

**Events to Subscribe:**
- Shipment created
- Picked up
- In Transit
- Out for Delivery
- Delivered
- Cancelled
- Lost in Transit
- RTO (Return to Origin)

4. Note the **Webhook Secret** and add it to `.env` file

### Webhook Payload Format

Shiprocket sends JSON payloads with tracking updates:

```json
{
  "event_type": "delivery_updated",
  "shipment_id": 123456789,
  "order_id": "ORDER-1",
  "tracking_number": "FDX7890123456",
  "status": "in_transit",
  "location": "Delhi Hub",
  "courier_name": "FedEx",
  "estimated_delivery_date": "2026-03-10",
  "delivered_date": null,
  "events": [
    {
      "status": "picked_up",
      "location": "Delhi Warehouse",
      "timestamp": "2026-03-05T10:00:00Z"
    }
  ]
}
```

### Webhook Response

Your backend should respond with:
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "order_id": 1
}
```

---

## Frontend Integration

### Display Tracking Information

The `MyOrders.js` component now displays:

1. **Tracking Badge** - Shows current shipping status with icon
2. **Tracking Details** - Carrier name, tracking number, estimated delivery
3. **Tracking History** - Timeline of all tracking events
4. **Direct Link** - Button to view on Shiprocket with tracking number

### User Features

Users can:
- View tracking number for their orders
- See estimated delivery date
- View tracking history with timestamps
- Click to view full details on Shiprocket

### Admin Features (Dashboard)

Admins can:
- Create shipments for orders
- View available courier options
- Generate shipping labels
- Download manifests
- Sync tracking information
- Cancel shipments if needed

---

## Testing

### 1. Test Order Creation with Shiprocket

```bash
# Create an order through frontend
# Navigate to cart → checkout → place order
# Payment should complete successfully

# Check backend logs:
# "Shiprocket Order Created: {...}"
```

### 2. Test Create Shipment (Admin)

```bash
# As admin, go to order details
# Click "Create Shipment"
# Select courier partner
# Confirm shipment creation

# Check order status changes to "processing"
# Tracking number should appear
```

### 3. Test Webhook Locally

Use ngrok to expose local server:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 5500

# Use ngrok URL in Shiprocket webhook: https://your-ngrok-url.ngrok.io/api/webhooks/shiprocket

# Send test payload:
curl -X POST http://localhost:5500/api/webhooks/shiprocket \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "delivery_updated",
    "shipment_id": 123456,
    "order_id": "ORDER-1",
    "tracking_number": "TEST123",
    "status": "in_transit",
    "location": "Delhi",
    "courier_name": "TEST"
  }'
```

### 4. Test Tracking Display

```bash
# After order status becomes "shipped"
# Go to MyOrders page
# Tracking info should display
# Click "View History" to see events
# Click "Track on Shiprocket" to verify link
```

---

## Production Deployment

### 1. Update Environment Variables

Add production credentials to your deployed environment:
```
SHIPROCKET_API_KEY=prod_api_key
SHIPROCKET_WAREHOUSE_ID=your_warehouse_id
SHIPROCKET_WEBHOOK_SECRET=prod_webhook_secret
```

### 2. Update Webhook URL

Update Shiprocket webhook settings to use your production domain:
```
https://yourdomain.com/api/webhooks/shiprocket
```

### 3. Database Backup

Before deploying migrations:
```bash
# Backup database
pg_dump ecommerce_db > backup_$(date +%Y%m%d).sql

# Run migration
psql -U postgres -d ecommerce_db -f MIGRATION_ADD_SHIPROCKET.sql
```

### 4. Test in Production

1. Create test order with production Razorpay credentials
2. Verify shipment creation
3. Test webhook with real Shiprocket data
4. Verify tracking display in MyOrders

### 5. SSL Certificate

Ensure HTTPS is enabled (required for webhooks):
```bash
# Using Let's Encrypt
sudo certbot renew --force-renewal
```

---

## Troubleshooting

### Issue: "Invalid API Key"
- Check `.env` file has correct `SHIPROCKET_API_KEY`
- Ensure no extra spaces in the key
- Verify key is copied completely from Shiprocket dashboard

### Issue: Shipment Creation Fails
- Check warehouse ID is correct
- Verify shipping pincode is in service area
- Check order items are valid
- Ensure order total is greater than 0

### Issue: Webhook Not Received
- Check webhook URL is publicly accessible (HTTPS)
- Verify webhook URL in Shiprocket settings matches exactly
- Check webhook secret in `.env` file
- Look at Shiprocket logs for webhook failures

### Issue: Tracking Not Updating
- Click "Sync Tracking" button in admin
- Check shipping_events table for webhook data
- Verify tracking_history table is being populated
- Check Shiprocket dashboard for shipment status

### Issue: Database Migration Fails
- Verify PostgreSQL version (9.6+)
- Check if table already has columns (use ALTER TABLE ADD IF NOT EXISTS)
- Run migration as database owner
- Check for naming conflicts with existing columns

---

## API Reference

### Shiprocket API Endpoints Used

1. **POST /orders/create/adhoc** - Create order in Shiprocket
2. **POST /shipments/create/adhoc** - Create shipment
3. **GET /shipments/:id** - Get shipment details
4. **GET /courier/track** - Get tracking info by tracking number
5. **GET /orders/:id/track** - Get order tracking
6. **GET /courier/serviceability** - Check courier availability
7. **POST /courier/assign/courierPartnerSuggestion** - Get courier suggestions
8. **POST /orders/generate/label** - Generate shipping label
9. **POST /orders/generate/manifest** - Generate manifest

---

## Support & Resources

- **Shiprocket Documentation:** https://shippockedocs.com/
- **Shiprocket API Docs:** https://apiv2.shiprocket.in/
- **Support Email:** support@shiprocket.in
- **Phone:** +91-9876543210

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up Shiprocket account and get API key
3. ✅ Add environment variables to `.env`
4. ✅ Run database migration
5. ✅ Update webhook configuration
6. ✅ Test in development environment
7. ✅ Deploy to production with updated webhook URL

For any questions or issues, refer to Shiprocket's official documentation or contact their support team.
