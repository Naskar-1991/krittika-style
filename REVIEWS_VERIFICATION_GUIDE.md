# Reviews System - Verification & Troubleshooting Guide

## Step 1: Verify Database Table Exists
Run this in your PostgreSQL terminal or use a tool like pgAdmin:

```sql
SELECT * FROM reviews LIMIT 1;
```

✅ If you get "relation reviews does not exist" - run: `node backend/runMigration.js`

---

## Step 2: Restart Backend Server

```bash
cd backend
npm install  # Make sure dependencies installed
node server.js
```

Expected output in terminal:
```
✅ Connected to PostgreSQL
Server running on port 5500
```

---

## Step 3: Restart Frontend Server

```bash
npm start
```

This will reload with the updated API_URL configuration.

---

## Step 4: Test API Endpoints (Browser DevTools)

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Navigate to any product's details page
4. Click on **Reviews** tab
5. You should see API calls in Network tab:
   - `GET /api/reviews/stats/[productId]` → Should return rating stats
   - `GET /api/reviews/product/[productId]` → Should return reviews list

---

## Step 5: Common Issues & Solutions

### Issue: "No ratings available" message appears
**Solution:**
- Open DevTools (F12) → Console tab
- Look for error messages (red text)
- Common causes:
  - Backend server not running
  - API_URL not set correctly in `.env`
  - CORS issue (check backend server logs)

### Issue: "Loading ratings..." but never loads
**Solution:**
- Check Network tab for failed requests (red)
- Verify backend is running on port 5500
- Check firewall isn't blocking port 5500

### Issue: POST request fails when trying to submit review
**Solution:**
- Check if you're logged in (token should be in localStorage)
- Open DevTools → Console tab
- Check for authentication errors
- Make sure backend received the POST request

---

## Step 6: Test with Sample Data (Optional)

If you want to test with existing reviews, run this SQL:

```sql
-- First, make sure you have products and users
INSERT INTO reviews (product_id, user_id, rating, title, review_text, is_verified_purchase)
VALUES 
  (1, 1, 5, 'Amazing product!', 'Great quality and fast shipping', true),
  (1, 2, 4, 'Good value', 'Product is good but shipping took longer', true),
  (1, 3, 5, 'Highly recommended', 'Perfect for my needs', true);
```

Then refresh your product page - you should see the reviews!

---

## Expected Result

Once everything is working:
- ✅ Rating summary showing average stars and distribution
- ✅ Review list showing all reviews with usernames and ratings
- ✅ Review form appears for logged-in users
- ✅ Helpful/Unhelpful buttons functional
- ✅ Sort dropdown working

---

## Need Help?

Check these in order:
1. Backend server running? → `node server.js` in backend folder
2. Frontend restarted? → `npm start` in root folder  
3. Network tab shows failed requests? → Check CORS/backend logs
4. Console errors? → Copy error messages and check solutions above
