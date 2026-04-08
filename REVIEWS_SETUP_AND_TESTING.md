# Reviews System Complete Setup & Testing Guide

This guide will help you verify the reviews system is working end-to-end, or identify exactly what's broken.

## Phase 1: Database Verification

### Step 1.1: Verify Reviews Table Exists

Run this script to check the database is properly set up:

```bash
cd backend
node verifyReviewsSetup.js
```

**Expected Output:**
```
✅ Connected to PostgreSQL
✅ Reviews table exists
✅ Admin moderation columns exist
📊 Reviews data summary:
Total reviews: 0
```

**If you see errors:**
- ❌ "Reviews table does NOT exist!" → Run migrations first:
  ```bash
  node -e "require('./db').runMigration('reviews')" 
  ```
  Or check [MIGRATION_ADD_REVIEWS.sql](./MIGRATION_ADD_REVIEWS.sql)

- ❌ "Cannot connect to PostgreSQL" → Check .env file values:
  - DB_HOST should be localhost
  - DB_PORT should be 5432
  - DB_USER, DB_PASS, DB_NAME should match your setup

---

## Phase 2: Backend Startup & API Testing

### Step 2.1: Start the Backend Server

```bash
cd backend
node server.js
```

**Expected Output:**
```
✅ Server running on http://localhost:5500
✅ Database connected
```

**Keep this terminal open!** You'll need the server running.

### Step 2.2: Test API Endpoints (in a new terminal)

```bash
cd backend
node testReviewsAPI.js
```

**Expected Output - All tests should pass:**
```
✅ GET /api/reviews/stats/1: 200 OK
✅ GET /api/reviews/product/1: 200 OK
✅ GET /api/reviews/all: 200 OK
✅ Auth protection working
✅ Admin routes protected
```

**If tests fail:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot reach backend at localhost:5500` | Server not running | Go back to Step 2.1 and start server |
| `404 Not Found` for /api/reviews endpoints | Routes not registered | Check server.js line 54: `app.use("/api/reviews", reviewsRoute);` |
| `500 Internal Server Error` | Database or code error | Check server console for stack trace |
| `401/403 Unauthorized` | Auth issue | Normal for endpoints requiring token |

---

## Phase 3: Frontend Testing

### Step 3.1: Start Frontend (new terminal)

```bash
cd krittika-style
npm start
```

**Wait for:** "Compiled successfully! You can now view... in your browser"

### Step 3.2: Log In

1. Open http://localhost:3000
2. Sign up or log in with email/password
3. Navigate to any product page
4. **Check DevTools Console (F12 → Console tab)**

### Step 3.3: Test Reviews Submission

1. Scroll down to "What Customers Say" section
2. Click "Write a Review"
3. Fill in the form and submit
4. **Monitor Console for logs:**
   ```
   Review data: {productId: 1, rating: 5, title: "...", ...}
   Submitting review to: http://localhost:5500/api/reviews
   Review response: {success: true, ...}
   ```

**If you see error in console:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot read properties of null (reading 'toFixed')` | API not returning data | Likely API endpoint issue, run Step 2.2 tests |
| `Authentication required` | Token not found | Log in again, reload page |
| `Failed to fetch` | Network issue | Backend not running, check Step 2.1 |
| `400 Bad Request` | Invalid data being sent | Check form validation in ReviewForm.js |

---

## Phase 4: Browser Developer Tools Inspection

### Step 4.1: Open Network Tab

1. Press F12 in browser
2. Go to Network tab
3. Refresh product page
4. Look for requests to `/api/reviews/...`

**You should see:**
- `GET /api/reviews/stats/1` → Status 200
- `GET /api/reviews/product/1?sortBy=recent` → Status 200

**If you don't see these requests:**
- Frontend not making API calls
- Check if ReviewsList.js component is rendering
- Verify API_URL is correct in BackendAPIConnection

### Step 4.2: Inspect Network Response

1. Click on `/api/reviews/stats/1` request
2. Go to Response tab
3. Should see JSON like:
   ```json
   {
     "total_reviews": 0,
     "average_rating": 0,
     "five_star": 0,
     "four_star": 0,
     "three_star": 0,
     "two_star": 0,
     "one_star": 0
   }
   ```

**If Response is empty or error:**
- Backend endpoint issue
- Check server console for errors
- Verify database connection

---

## Phase 5: Database Inspection (Advanced)

If all API tests pass but reviews don't appear, check database directly:

### Step 5.1: Connect to PostgreSQL

```bash
psql -U <your_db_user> -d <your_db_name>
```

### Step 5.2: Check Reviews Table

```sql
-- Check reviews table structure
\d reviews

-- Check if any reviews exist
SELECT COUNT(*) FROM reviews;

-- Check if there are products
SELECT COUNT(*) FROM products;

-- Check rating stats for product ID 1
SELECT 
  COUNT(*) as total_reviews,
  AVG(rating) as average_rating,
  SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star
FROM reviews 
WHERE product_id = 1;

-- Exit psql
\q
```

---

## Phase 6: Troubleshooting Checklist

Work through these in order:

- [ ] Database verification passed (Step 1.1)
- [ ] Backend server starts without errors (Step 2.1)
- [ ] API tests all pass (Step 2.2)
- [ ] Frontend starts without errors (Step 3.1)
- [ ] Logged in to frontend successfully
- [ ] Network tab shows API requests (Step 4.1)
- [ ] API responses are valid JSON (Step 4.2)
- [ ] Can see "What Customers Say" section on product page
- [ ] Can click "Write a Review" button
- [ ] Form submits without console errors
- [ ] Review appears in list seconds after submission

### If something isn't checked:
1. Go to the corresponding step above
2. Check "Expected Output"
3. Match your output against it
4. Apply the fix for your error type

---

## Quick Fix Commands

**Backend won't start:**
```bash
cd backend
npm install
node server.js
```

**API tests failing:**
```bash
# Check backend logs - start fresh
node server.js

# In another terminal, run tests
node testReviewsAPI.js
```

**Frontend can't load:**
```bash
cd krittika-style
npm install
npm start
```

**Database issues:**
```bash
# Verify connection
node verifyReviewsSetup.js

# Check .env file exists in backend/
cat .env

# Manually verify database by psql if needed
```

---

## Understanding the Reviews Flow

```
User Experience:
1. User visits product page
2. ComponentDidMount → ReviewsList useEffect fires
3. ReviewsList calls: GET /api/reviews/product/1
4. RatingSummary calls: GET /api/reviews/stats/1
5. Both APIs return data
6. Components render reviews and rating summary
7. User clicks "Write Review" → ReviewForm shows
8. User submits review → ReviewForm calls POST /api/reviews
9. Backend creates record in reviews table
10. ReviewsList refreshes → Shows new review

If anything breaks at any step above, review won't work.
See Phase 4 Network tab inspection to find exactly where it breaks.
```

---

## Testing with Real Data

After everything passes:

1. Go to product page in frontend
2. Click "Write a Review"
3. Fill in:
   - Rating: 5 stars
   - Title: "Amazing product!"
   - Review: "This is the best product I've ever used"
4. Click Submit
5. Should see:
   - Console: `Review response: {success: true, id: 1}`
   - Review appears in list below
   - Rating summary updates with 5-star rating

---

## Need More Help?

If you're stuck:
1. Note the **exact error message** you see
2. Note which **step** you're on
3. Check the **troubleshooting table** for that phase
4. Share the error and which step with developer

Good luck! 🚀
