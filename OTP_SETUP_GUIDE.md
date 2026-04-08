# Mobile Number OTP Verification - Complete Setup Guide

## Overview
This guide explains how to set up and use the mobile number OTP verification feature for both **Sign Up** and **Sign In** flows in the KrittikaStyle e-commerce application.

---

## Architecture

### Three-Layer Implementation:

1. **Backend**: Express.js with Node.js
   - OTP generation and verification
   - SMS delivery via Twilio
   - Database storage with PostgreSQL
   
2. **Frontend**: React
   - Signup flow with OTP verification
   - Login flow with OTP verification
   - Reusable OTP verification component

3. **Database**: PostgreSQL
   - New fields for OTP management
   - Tracking verification status

---

## Installation Steps

### 1. Install Dependencies

Navigate to the backend directory and install Twilio:

```bash
cd krittika-style/backend
npm install twilio
```

### 2. Update Database

Run the migration to add OTP-related fields:

```bash
# Connect to your PostgreSQL database and run:
psql -U postgres -d ecommerce -f MIGRATION_ADD_OTP_VERIFICATION.sql
```

Or execute the SQL directly in your database client:

```sql
-- Add OTP-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_otp_sent TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_complete BOOLEAN DEFAULT false;

-- Add indexes for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_mobile_verified ON users(mobile_verified);
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OTP Settings
OTP_EXPIRY_MINUTES=10
MAX_OTP_ATTEMPTS=3

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## Twilio Setup

### Getting Twilio Credentials:

1. **Create a Twilio Account**
   - Visit [https://www.twilio.com](https://www.twilio.com)
   - Sign up for a free account

2. **Get Your Credentials**
   - Go to [Twilio Console](https://www.twilio.com/console)
   - Copy your **Account SID**
   - Copy your **Auth Token**

3. **Get a Phone Number**
   - In Twilio Console, go to "Phone Numbers"
   - Click "Get a Number"
   - Select your country (use +91 for India)
   - Confirm the number
   - Use this number in `TWILIO_PHONE_NUMBER` variable

4. **Add Phone Number to .env:**
   ```env
   TWILIO_PHONE_NUMBER=+919876543210  # For India
   # OR
   TWILIO_PHONE_NUMBER=+1234567890    # For USA
   ```

### Testing with Twilio Trial Account:
- Free trial can send SMS to verified numbers only
- Add numbers in Twilio Console under "Verified Caller IDs"
- For production, upgrade your Twilio account

---

## API Endpoints

### Sign Up Flow

#### 1. Initiate Sign Up (Request OTP)
```
POST /api/auth/signup-initiate
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "mobile": "9876543210"
}

Response (200):
{
  "message": "OTP sent successfully to your mobile number",
  "mobileHint": "3210",
  "expiresIn": 10
}

Response (400):
{
  "error": "Email already exists" | "Mobile number already registered" | "Invalid email format"
}
```

#### 2. Verify OTP (Complete Sign Up)
```
POST /api/auth/signup-verify
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}

Response (200):
{
  "message": "Signup completed successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "mobileVerified": true
  }
}

Response (400):
{
  "error": "Invalid OTP" | "OTP has expired" | "Too many failed attempts"
}
```

#### 3. Resend OTP
```
POST /api/auth/signup-resend-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "mobile": "9876543210"
}

Response (200):
{
  "message": "New OTP sent successfully",
  "expiresIn": 10
}

Response (429):
{
  "error": "Please wait 30 seconds before requesting a new OTP"
}
```

### Sign In Flow

#### 1. Initiate Login (Request OTP)
```
POST /api/auth/login-initiate
Content-Type: application/json

{
  "email": "john@example.com"
}

Response (200):
{
  "message": "OTP sent successfully to your registered mobile",
  "mobileHint": "3210",
  "expiresIn": 10
}

Response (400):
{
  "error": "User not found or mobile not verified"
}
```

#### 2. Verify OTP (Complete Login)
```
POST /api/auth/login-verify
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}

Response (200):
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "mobileVerified": true,
    "role": "user"
  }
}

Response (400):
{
  "error": "Invalid OTP" | "OTP has expired"
}
```

---

## Frontend Components

### OTPVerification Component

**Location:** `src/components/OTPVerification.js`

**Props:**
```javascript
<OTPVerification
  email="john@example.com"
  mobileHint="3210"                    // Last 4 digits of mobile
  expiresIn={10}                        // OTP expiration time in minutes
  onVerify={(otp) => {...}}            // Callback when OTP is verified
  onResend={() => {...}}               // Callback when resending OTP
  loading={false}                       // Show loading state
  error={null}                          // Error message to display
  success={null}                        // Success message
  flow="signup"                         // 'signup' or 'login'
/>
```

### Updated Pages

1. **Signup.js** (`src/pages/Signup.js`)
   - Form input step (name, email, password, mobile)
   - OTP verification step
   - Success confirmation step

2. **Login.js** (`src/pages/Login.js`)
   - Email input step
   - OTP verification step
   - Success confirmation step

---

## Development Mode

If Twilio is not configured, the system runs in **Development Mode**:
- OTP is logged to console instead of being sent via SMS
- Useful for testing without SMS charges
- Check server console for OTP codes

**Console Output Example:**
```
📨 [DEV MODE] OTP for +919876543210: 123456
```

---

## Security Features

✅ **Implemented Security Measures:**

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **Attempt Limiting**: Maximum 3 failed verification attempts
3. **Rate Limiting**: 30-second wait between OTP requests
4. **Password Hashing**: bcrypt for password encryption (10 rounds)
5. **JWT Tokens**: Secure token-based authentication
6. **Mobile Verification**: Users must verify mobile number during signup
7. **Secure SMS**: Twilio provides encrypted SMS delivery

---

## Database Schema

### New Fields in `users` Table:

| Column | Type | Description |
|--------|------|-------------|
| `otp_code` | VARCHAR(6) | Current OTP code |
| `otp_expiry` | TIMESTAMP | When OTP expires |
| `mobile_verified` | BOOLEAN | Is mobile number verified? |
| `otp_attempts` | INTEGER | Failed OTP verification count |
| `last_otp_sent` | TIMESTAMP | When last OTP was sent |
| `signup_complete` | BOOLEAN | Is signup process finished? |

---

## Testing Guide

### Manual Testing with Twilio Trial

1. **Sign Up Test:**
   - Use a verified phone number
   - Fill signup form
   - Receive OTP on registered phone
   - Enter OTP to complete signup

2. **Login Test:**
   - Enter email address
   - Receive OTP on registered phone
   - Enter OTP to login

3. **Error Testing:**
   - Try invalid OTP
   - Wait for OTP to expire
   - Try exceeding max attempts
   - Try resending too quickly

### Development Testing

1. Check server console for OTP codes
2. Use any valid email and phone number
3. Test OTP expiration timer
4. Test resend functionality

---

## Troubleshooting

### "OTP not received"
- ✅ Check Twilio credentials in `.env`
- ✅ Verify phone number is properly formatted (+country code)
- ✅ For Twilio trial, add phone number as verified
- ✅ Check Twilio account balance

### "TWILIO_ACCOUNT_SID not configured"
- ✅ Check `.env` file exists in backend directory
- ✅ Restart server after changing `.env`
- ✅ System will log warning and work in dev mode

### "OTP expired"
- ✅ OTP is valid for 10 minutes
- ✅ User can request new OTP after 30 seconds
- ✅ Waiting time between requests prevents abuse

### "Too many failed attempts"
- ✅ Maximum 3 failed attempts allowed
- ✅ User must request a new OTP via resend button
- ✅ Fresh OTP resets the attempt counter

### Port Already in Use
```bash
# Kill process on port 5500
npx kill-port 5500

# Or change port in .env
PORT=5501
```

---

## Performance Optimization

- ✅ OTP indexes for fast database lookups
- ✅ JWT token caching in localStorage
- ✅ Debounced form inputs
- ✅ Optimized re-renders with React hooks
- ✅ Efficient SMS delivery via Twilio

---

## Deployment Checklist

- [ ] Twilio credentials securely stored in `.env`
- [ ] Database migration applied
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set on server
- [ ] `.env` file not committed to git
- [ ] Test signup flow end-to-end
- [ ] Test login flow end-to-end
- [ ] Monitor Twilio SMS delivery
- [ ] Set up error logging
- [ ] Configure rate limiting on production

---

## File Structure

```
backend/
├── routes/
│   └── auth.js                           # Updated with OTP endpoints
├── services/
│   └── otpService.js                     # NEW: OTP logic
├── MIGRATION_ADD_OTP_VERIFICATION.sql    # NEW: Database migration
└── .env                                  # Update with Twilio config

frontend/
└── src/
    ├── components/
    │   ├── OTPVerification.js             # NEW: OTP input component
    │   └── OTPVerification.css            # NEW: OTP styling
    └── pages/
        ├── Signup.js                      # Updated with OTP flow
        ├── Login.js                       # Updated with OTP flow
        └── Signup.css                     # Updated with button styles
```

---

## Support

For issues or questions:
- 📧 Email: support@krittikastyle.com
- 📱 Twilio Docs: https://www.twilio.com/docs/sms
- 🐛 GitHub Issues: [Your repo link]

---

## Version History

**v1.0.0** (Current)
- ✅ Mobile OTP verification for signup
- ✅ Mobile OTP verification for login
- ✅ Twilio integration
- ✅ Rate limiting and security
- ✅ Development mode support
