# Razorpay Payment Gateway Integration Setup

## 1. Environment Configuration

Create a `.env` file in the `/backend` folder with the following credentials:

```env
# Razorpay API Keys - Get these from https://dashboard.razorpay.com/
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# JWT Secret (existing)
JWT_SECRET=your_jwt_secret_here

# Database (existing)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=your_password
```

## 2. Get Your Razorpay API Keys

1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up or log in to your account
3. Go to **Settings > API Keys**
4. Copy your **Key ID** and **Key Secret**
5. Paste them into the `.env` file

## 3. Database Migration

Run the migration to add payment fields to the orders table:

```bash
# In backend folder
psql -U postgres -d ecommerce -f MIGRATION_ADD_PAYMENT.sql
```

Or execute the SQL manually in pgAdmin/DBeaver with this query:

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
```

## 4. Install Dependencies

```bash
cd backend
npm install
```

## 5. Start the Backend Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

## 6. Payment Flow

### Frontend Flow:
1. User fills shipping details
2. Clicks "Proceed to Payment"
3. Order is created with status `pending`
4. Razorpay payment modal opens
5. User enters payment details (Card, UPI, NetBanking, etc.)
6. Payment is processed by Razorpay

### Backend Flow:
1. **Create Order** - Creates order with `payment_status: pending`
2. **Create Razorpay Order** - Generates Razorpay order ID
3. **Verify Payment** - Validates Razorpay signature and updates order status
4. **Order Status Updates**:
   - ✅ Payment successful → `payment_status: completed`, `status: processing`
   - ❌ Payment failed → `payment_status: failed`

## 7. API Endpoints

### Create Razorpay Order
```
POST /api/payment/create-order
Headers: Authorization: Bearer {token}
Body: {
  orderId: number,
  amount: number,
  email: string,
  phoneNumber: string
}
Response: {
  razorpayOrderId: string,
  amount: number,
  currency: "INR",
  keyId: string
}
```

### Verify Payment
```
POST /api/payment/verify-payment
Headers: Authorization: Bearer {token}
Body: {
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  orderId: number
}
Response: {
  success: true,
  order: { payment details }
}
```

### Get Payment Status
```
GET /api/payment/status/{orderId}
Headers: Authorization: Bearer {token}
Response: {
  payment_status: "completed|failed|pending",
  razorpay_order_id: string,
  razorpay_payment_id: string,
  payment_method: string
}
```

## 8. Testing Payment

### Test Cards (Use these in test mode):
- **Visa**: 4111111111111111 | Expiry: Any future date | CVV: Any 3 digits
- **Mastercard**: 5555555555554444 | Expiry: Any future date | CVV: Any 3 digits
- **UPI**: testmerchant@okhdfcbank (for UPI testing)

**Note**: Test mode uses fake amounts and won't charge actual cards.

## 9. Security Notes

⚠️ **Important Security Measures**:
1. Never commit `.env` file to git
2. Keep `RAZORPAY_KEY_SECRET` confidential
3. Signature verification is mandatory for payment verification
4. Only verify payments from the backend, never from frontend
5. Store `razorpay_signature` for audit trails

## 10. Enable Live Mode

To accept real payments:
1. Complete Razorpay KYC verification
2. Switch from Test to Live mode in dashboard
3. Update `.env` with **Live** API keys (not Test keys)
4. Deploy to production

## 11. Troubleshooting

### "Razorpay script failed to load"
- Check internet connection
- Verify no CORS issues
- Check browser console for errors

### "Invalid payment signature"
- Ensure `RAZORPAY_KEY_SECRET` is correct
- Check if using correct test/live keys

### Payment verified but order not updated
- Check database connection
- Verify user authentication token
- Check backend logs for SQL errors

## 12. Features Included

✅ Complete payment integration
✅ UPI, Card, NetBanking support  
✅ One-click recurring payments (future)
✅ Refund handling (future)
✅ Payment webhook support (future)
✅ Multi-currency support (future)
