# Reviews System Quick Reference

## Problem: Can't see or write reviews, getting "Cannot read properties of null" error

### ⚡ Quick Diagnosis (5 minutes)

Run these commands in order to find the exact problem:

**Terminal 1: Check Database**
```bash
cd backend
node verifyReviewsSetup.js
```
✅ Should show "Reviews table setup verified!"

**Terminal 2: Check Backend API**
```bash
cd backend
node server.js
```
✅ Should show "Server running on http://localhost:5500"

**Terminal 3: Test API Endpoints**
```bash
cd backend
node testReviewsAPI.js
```
✅ Should show mostly green checkmarks

**Terminal 4: Start Frontend**
```bash
cd krittika-style
npm start
```
✅ Should compile successfully

### 🔍 Where's The Problem?

| What Fails | Where to Look | Fix |
|-----------|----------------|-----|
| `verifyReviewsSetup.js` | Database setup | See "Database Issues" below |
| `node server.js` | Backend startup | See "Backend Issues" below |
| `testReviewsAPI.js` | API endpoints | See "API Issues" below |
| Frontend won't load | Frontend setup | See "Frontend Issues" below |
| Reviews don't show up | API connectivity | See "Network Issues" below |

---

## 🗄️ Database Issues

**"Reviews table does NOT exist"**
```bash
# Check your database schema
psql -U youruser -d yourdb

# Inside psql:
\d reviews
```

If missing: Run the migration
```bash
cd backend
# Check if migration file exists
ls | grep -i "MIGRATION_ADD_REVIEWS"

# Run migration (method 1 - if migration script exists)
node runMigration.js

# OR by manually executing SQL
psql -U youruser -d yourdb < MIGRATION_ADD_REVIEWS.sql
```

**"Cannot connect to PostgreSQL"**
```bash
# Check .env file
cat backend/.env

# Should have:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=your_user
# DB_PASS=your_password
# DB_NAME=your_database

# Test database manually:
psql -U your_user -d your_database
```

---

## 🚀 Backend Issues

**"Server not starting"**
```bash
cd backend
npm install  # Update dependencies
node server.js
```

**"Port 5500 already in use"**
```bash
# Find what's using port 5500
netstat -ano | findstr :5500

# Kill it (Windows PowerShell as admin)
Stop-Process -Id <PID> -Force

# Or change port in .env or server.js
```

**"Routes not registered"**
```bash
# Check server.js has these lines:
grep "reviewsRoute" backend/server.js
grep "/api/reviews" backend/server.js

# Should show:
# const reviewsRoute = require("./routes/reviews");
# app.use("/api/reviews", reviewsRoute);
```

---

## 📡 API Issues

**"GET /api/reviews/stats/1 returns 404"**
- Endpoint doesn't exist
- Check: `backend/routes/reviews.js` file exists
- Check: `GET /stats/:productId` route defined
- Check: `app.use("/api/reviews", reviewsRoute)` in server.js

**"GET /api/reviews/stats/1 returns 500"**
- Server error (check backend console)
- Likely database query failing
- Check: Database connection working
- Check: reviews table has data

**"POST /api/reviews returns 401 Unauthorized"**
- This is expected! Must login first
- If NOT logged in: message is correct
- If logged in: token not being sent
- Check: ReviewForm receives token from localStorage

---

## 🌐 Frontend Issues

**"Cannot reach backend at http://localhost:5500"**
```bash
# Check API_URL is correct
grep "API_URL" krittika-style/src/api_connection/BackendAPIConnection.js

# Should be:
# export const API_URL = 'http://localhost:5500';

# Backend must be running:
cd backend && node server.js
```

**"npm start fails or doesn't open browser"**
```bash
cd krittika-style
npm install
npm start

# If port 3000 in use:
# Kill it or change in .env: PORT=3001
```

**"Components don't render"**
- Check DevTools console (F12)
- Look for red errors
- If seeing "Cannot read properties of null" → Backend not returning data

---

## 🔗 Network Issues (Most Common)

**Symptom: Reviews section appears but empty/broken**

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for requests to `/api/reviews`

**If you don't see any requests:**
- Components not rendering
- Check: Product page has ReviewsList component
- Check: API_URL configured correctly
- Check: Backend running

**If requests are 404/500:**
- API endpoint broken or doesn't exist
- Run: `node testReviewsAPI.js` to diagnose
- Check: server.js has reviews route registered

**If requests are 200 but reviews don't show:**
- API returning empty/wrong data
- Check Network tab → Response
- Should see: `{"total_reviews": 0, "average_rating": 0, ...}`
- Check: Database table has data (products, reviews)

---

## ✅ Step-by-Step Test

If basic checks pass, test end-to-end:

```bash
# Terminal 1: Database
cd backend && node verifyReviewsSetup.js

# Terminal 2: Backend
cd backend && node server.js

# Terminal 3: Test API
cd backend && node testReviewsAPI.js
# Take a screenshot of results

# Terminal 4: Frontend  
cd krittika-style && npm start
# Wait for "Compiled successfully"

# Browser:
# 1. Go to http://localhost:3000
# 2. Log in (if not already)
# 3. Go to any product → click on it
# 4. Press F12 → Console tab
# 5. Should see logs (no red errors)
# 6. Scroll to "What Customers Say"
# 7. Click "Write a Review"
# 8. Fill form and submit
# 9. See console: Review response: {success: true}
# 10. Review should appear in list
```

---

## 📋 The 5-Minute Checklist

- [ ] Database table exists: `node verifyReviewsSetup.js` ✅
- [ ] Backend starts: `node server.js` ✅
- [ ] API responds: `node testReviewsAPI.js` ✅
- [ ] Frontend loads: `npm start` ✅
- [ ] Can log in successfully
- [ ] Product page loads without errors (F12 console)
- [ ] Can see "What Customers Say" section
- [ ] Can click "Write a Review" button
- [ ] Can submit review without console errors
- [ ] Review appears in list

✅ = All pass = System working!

---

## Common Solutions

**"Still not working":**

Most common fix:
```bash
# Kill everything
Ctrl+C  # In all terminals

# Fresh start
cd backend && npm install && node server.js
# In new terminal:
cd krittika-style && npm install && npm start
```

**"Still seeing null error":**
- Run diagnostic tests above to find exact issue
- Note the error message and which test fails
- Share that with developer

**"No reviews appear anywhere":**
- Did you create a review? (Database should have data)
- Check Network tab in DevTools
- Check API response in Network tab
- Post a review, check if it's in database:
  ```bash
  psql -U user -d database
  SELECT * FROM reviews;
  ```
