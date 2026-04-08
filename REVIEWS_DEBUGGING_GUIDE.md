# Reviews API - Debugging Guide

## Issue: Reviews Not Appearing + Null Error

If you see: `Cannot read properties of null (reading 'toFixed')` or reviews aren't appearing, follow this guide.

---

## Step 1: Check Basic Setup ✅

### Verify Environment Variables
In your project root `.env` file, ensure you have:
```env
REACT_APP_API_DEV_URL=http://localhost:5500
```

### Verify Backend is Running
```bash
cd backend
node server.js
```

Expected output:
```
✅ Connected to PostgreSQL
Server running on port 5500
```

### Verify Frontend is Running  
```bash
npm start
```

Expected: Browser opens at `http://localhost:3000`

---

## Step 2: Test API Endpoints Directly

Open browser DevTools (F12) → Console tab and paste:

### Test 1: Check if Backend is Reachable
```javascript
fetch('http://localhost:5500/api/reviews/stats/1')
  .then(r => r.json())
  .then(data => console.log('Stats API:', data))
  .catch(e => console.error('Error:', e))
```

You should see response like:
```json
{
  "total_reviews": "0" or 5,
  "average_rating": null or 4.5,
  "five_star": 0,
  "four_star": 0,
  ...
}
```

### Test 2: Check List Reviews API
```javascript
fetch('http://localhost:5500/api/reviews/product/1')
  .then(r => r.json())
  .then(data => console.log('Reviews:', data))
  .catch(e => console.error('Error:', e))
```

Should return:
```json
{
  "reviews": [],
  "stats": { ... }
}
```

### Test 3: Check if Database Has Data
In PostgreSQL terminal:
```sql
-- Check if reviews table exists
SELECT * FROM reviews LIMIT 5;

-- Check stats
SELECT COUNT(*) as total, AVG(rating) as avg FROM reviews;
```

---

## Step 3: Common Issues & Solutions

### Issue: "Cannot read properties of null" Error

**Cause:** `average_rating` is null when no reviews exist or API returns null

**Fix:** ✅ Already implemented in RatingSummary.js (should be resolved)

After fixing, clear cache and restart:
```bash
# Clear browser cache
# Ctrl+F5 or Cmd+Shift+R

# Restart frontend
Ctrl+C  # Stop current npm start
npm start
```

---

### Issue: "Failed to fetch reviews" Message  

**Possible Causes:**

**1. Backend not running**
- Go to terminal running backend
- Should see: `Server running on port 5500`
- If not: `cd backend && node server.js`

**2. Wrong API_URL**
- Check browser Console (F12)
- Look for network requests
- Click on failed request
- Check "Request URL" - should be `http://localhost:5500/api/reviews/...`

**3. CORS Issue**
- Check browser Console for CORS error
- Verify backend `server.js` has:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',  // ← Must match frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**4. API Endpoint Not Registered**
- Check `backend/server.js` has:
```javascript
const reviewsRoute = require("./routes/reviews");
app.use("/api/reviews", reviewsRoute);
```

---

### Issue: "No ratings available" Message

**Cause:** Stats API returned empty or null data

**Solution:**

1. Check database has reviews table:
```sql
SELECT COUNT(*) FROM reviews;
```

2. If count is 0, that's normal! Component should show "No ratings yet"

3. If error persists, check browser console logs:
- Open DevTools (F12)
- Go to Console tab
- Look for red errors
- Copy exact error message

---

## Step 4: Verify Reviews Components Are Loaded

In browser Console, paste:
```javascript
// Check if components are rendering
setTimeout(() => {
  const reviewSection = document.querySelector('.reviews-container');
  const ratingSummary = document.querySelector('.rating-summary');
  const reviewForm = document.querySelector('.review-form-container');
  
  console.log('Review section found:', !!reviewSection);
  console.log('Rating summary found:', !!ratingSummary);
  console.log('Review form found:', !!reviewForm);
}, 1000);
```

Should log:
```
Review section found: true
Rating summary found: true
Review form found: true
```

---

## Step 5: Create Test Review

To see reviews in action, create one:

1. Go to any product page
2. Click **Reviews** tab
3. Should see:
   - ⭐ Rating summary (or "No ratings yet")
   - ✍️ Review form (if logged in)
   - 📝 List of reviews (or empty)

4. **If logged in:** Fill form and submit
   - Enter rating: 1-5 stars
   - Enter title: "Test Review"
   - Enter text: "This is a test"
   - Click Submit

5. Watch browser console for logs:
   - `Submitting review to: http://localhost:5500/api/reviews`
   - `Review response: { message: "...", review: {...} }`

---

## Step 6: Check Database Directly

Verify data is being saved:

```sql
-- See all reviews
SELECT id, user_id, product_id, rating, title, created_at FROM reviews;

-- Check stats
SELECT 
  COUNT(*) as total,
  AVG(rating) as avg_rating,
  MIN(rating) as lowest,
  MAX(rating) as highest
FROM reviews;

-- Test specific product
SELECT * FROM reviews WHERE product_id = 1;
```

---

## Step 7: Network Inspection

In Browser DevTools:

1. Go to **Network** tab
2. Click F5 to reload page
3. Go to product details page
4. Click **Reviews** tab
5. Look for these requests:
   - `GET .../api/reviews/stats/1` - Should return 200 with JSON
   - `GET .../api/reviews/product/1` - Should return 200 with JSON

If requests show:
- ❌ 404 - Endpoint not found (check server.js registration)
- ❌ 500 - Server error (check backend console logs)
- ✅ 200 - Success! (check response data)

---

## Step 8: Backend Console Logs

Watch your backend terminal while testing:

Should see logs like:
```
GET /api/reviews/stats/1
GET /api/reviews/product/1?sortBy=recent
POST /api/reviews (when submitting)
```

If not appearing, backend isn't receiving requests.

---

## Complete Troubleshooting Checklist

- [ ] `.env` has `REACT_APP_API_DEV_URL=http://localhost:5500`
- [ ] Backend running: `node server.js` shows "Server running on port 5500"
- [ ] Frontend running: `npm start` opens browser
- [ ] Can access `http://localhost:3000` in browser
- [ ] Product page loads
- [ ] Reviews tab available (or visible by default)
- [ ] Browser console shows no red errors
- [ ] Network tab shows 200 responses for reviews requests
- [ ] Database has reviews table: `SELECT * FROM reviews;` works
- [ ] Can see review form if logged in
- [ ] No "Cannot read properties of null" errors

---

## Final Solution

If still having issues after all above:

1. **Hard refresh browser**
   ```
   Windows: Ctrl+F5
   Mac: Cmd+Shift+R
   ```

2. **Clear localStorage**
   Paste in browser console:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

3. **Restart everything**
   ```bash
   # Kill backend (Ctrl+C)
   # Kill frontend (Ctrl+C)
   # Restart backend
   cd backend && node server.js
   # Restart frontend (in new terminal)
   npm start
   ```

4. **Check all 3 things are running:**
   - PostgreSQL database ✅
   - Backend server on port 5500 ✅
   - Frontend server on port 3000 ✅

---

## Getting Help

If still stuck, note down:
1. Exact error message from console
2. Screenshot of Network tab showing failed request
3. Output from `SELECT * FROM reviews;` in database
4. Backend console output when you try to view reviews
5. What you expect vs what you're seeing

This will help diagnose quickly!
