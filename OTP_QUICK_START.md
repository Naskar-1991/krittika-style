# Mobile OTP Verification - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Package
```bash
cd backend
npm install twilio
```

### Step 2: Update Database
```bash
psql -U postgres -d ecommerce -f MIGRATION_ADD_OTP_VERIFICATION.sql
```

### Step 3: Configure .env
Create `backend/.env` with:
```env
TWILIO_ACCOUNT_SID=your_sid_from_twilio
TWILIO_AUTH_TOKEN=your_token_from_twilio
TWILIO_PHONE_NUMBER=+919876543210
OTP_EXPIRY_MINUTES=10
MAX_OTP_ATTEMPTS=3
JWT_SECRET=your_secret
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5500
```

### Step 4: Get Twilio Account
1. Go to https://www.twilio.com
2. Sign up (free account with trial credits)
3. Go to https://www.twilio.com/console
4. Copy Account SID
5. Copy Auth Token
6. Get a phone number (select country, confirm)
7. Add to .env

### Step 5: Restart Backend
```bash
npm run dev
```

## 🎯 How It Works

### Sign Up
```
User visits /signup
  ↓
Fills form (name, email, password, mobile)
  ↓
Clicks "Create Account"
  ↓
OTP sent to mobile
  ↓
User enters OTP
  ↓
Account created & auto-logged in
  ↓
Redirected to home page
```

### Login
```
User visits /login
  ↓
Enters email
  ↓
Clicks "Send OTP"
  ↓
OTP sent to registered mobile
  ↓
User enters OTP
  ↓
Logged in automatically
  ↓
Redirected to home page
```

## 📱 Testing Without Twilio

If you don't have Twilio credentials yet, the system works in **dev mode**:
- OTP appears in server console
- All features work normally
- No SMS charges
- Perfect for testing

**Check server logs for OTP:**
```
📨 [DEV MODE] OTP for +919876543210: 123456
```

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup-initiate` | Start signup, send OTP |
| POST | `/api/auth/signup-verify` | Verify OTP, complete signup |
| POST | `/api/auth/signup-resend-otp` | Resend OTP during signup |
| POST | `/api/auth/login-initiate` | Start login, send OTP |
| POST | `/api/auth/login-verify` | Verify OTP, complete login |

## 🎨 Frontend Components

- **OTPVerification.js** - Reusable OTP input component
- **Signup.js** - Multi-step signup with OTP
- **Login.js** - Email + OTP based login

## 📊 Database Fields Added

```
users table:
├── otp_code (VARCHAR 6)
├── otp_expiry (TIMESTAMP)
├── mobile_verified (BOOLEAN)
├── otp_attempts (INTEGER)
├── last_otp_sent (TIMESTAMP)
└── signup_complete (BOOLEAN)
```

## ✨ Key Features

✅ 6-digit OTP verification  
✅ 10-minute expiration  
✅ 3 attempt limit  
✅ 30-second resend cooldown  
✅ Mobile responsive UI  
✅ Real-time countdown timer  
✅ Automatic retry  
✅ Error handling  

## 🐛 Troubleshooting

**"Twilio not configured"**
→ Check .env file, restart server

**"OTP not received"**
→ Check Twilio credentials, verify phone number format

**"OTP expired"**
→ User must resend OTP (30-sec wait)

**"Too many attempts"**
→ User must resend OTP to reset counter

## 📚 Full Documentation

See: `OTP_SETUP_GUIDE.md` for complete documentation

## 🎁 Bonus: Getting Free Twilio

1. Go to https://www.twilio.com
2. Sign up (no credit card needed for trial)
3. Get $15 free trial credits
4. Verify your number to receive SMS
5. Get a Twilio phone number
6. Ready to test!

## 🔗 Useful Links

- [Twilio Console](https://www.twilio.com/console)
- [Twilio SMS Docs](https://www.twilio.com/docs/sms)
- [Free Trial Info](https://www.twilio.com/try-twilio)

## ✅ After Setup Checklist

- [ ] Database migration ran successfully
- [ ] Twilio credentials in .env
- [ ] npm install completed
- [ ] Server restarted
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Check console for OTP in dev mode
- [ ] Verify mobile number delivery (if using Twilio)

## 🎯 What's Next?

1. Test the signup/login flows
2. Monitor OTP delivery in Twilio dashboard
3. Configure rate limits if needed
4. Set up error logging
5. Deploy to staging
6. Get user feedback
7. Deploy to production

---

**Made with ❤️ for KrittikaStyle**
