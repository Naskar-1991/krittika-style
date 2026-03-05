# Quick Start Testing Guide - User Account Features

## 🎯 Test Objectives

This guide walks you through testing all newly implemented user account features.

---

## 🔧 Pre-Testing Checklist

- ✅ Backend running on port 5500
- ✅ Frontend running on port 3000
- ✅ Database connected and schema updated
- ✅ Browser opened to http://localhost:3000

---

## Test 1: Signup with Mobile Number

### Steps:
1. Navigate to `http://localhost:3000/signup`
2. Fill in the form:
   - **Full Name**: John Doe
   - **Email**: john@example.com
   - **Mobile**: 9876543210 (exactly 10 digits)
   - **Password**: password123
3. Click "Sign Up"

### Expected Results:
- ✅ Form validates mobile as 10 digits
- ✅ Success message displays
- ✅ Redirect to login page after 2 seconds
- ✅ Mobile number saved in database

### Database Check:
```sql
SELECT id, name, email, mobile, role 
FROM users 
WHERE email = 'john@example.com';
```

Expected: Row with mobile = '9876543210'

---

## Test 2: Login & Navigate to Profile

### Steps:
1. From login page, enter credentials:
   - **Email**: john@example.com
   - **Password**: password123
2. Click "Login"
3. Click on user menu (top-right corner)
4. Click "⚙️ Profile Settings"

### Expected Results:
- ✅ Successful login
- ✅ Redirected to home page
- ✅ User menu opens with options
- ✅ Navigate to /profile page
- ✅ Profile "Account Info" tab opens

---

## Test 3: View Profile Information

### Steps:
On the Profile page, Account Info tab:

### Expected Display:
- Full Name: John Doe
- Email: john@example.com
- Mobile: 📱 9876543210
- Account Type: user (blue badge)
- Member Since: [Today's date]

### Test Edit Mode:
1. Click "✏️ Edit" button
2. Verify form shows:
   - Name field (editable)
   - Email field (read-only, greyed out)
   - Mobile field (editable)

---

## Test 4: Update Profile

### Steps:
1. In Edit mode, change:
   - Name: Jane Doe
   - Mobile: 9123456789
2. Click "✓ Save Changes"

### Expected Results:
- ✅ Success message: "Profile updated successfully!"
- ✅ Form exits edit mode
- ✅ Values update on display
- ✅ Changes persist in database

### Database Check:
```sql
SELECT id, name, mobile FROM users WHERE id = [user_id];
```

Expected: name='Jane Doe', mobile='9123456789'

---

## Test 5: Change Password

### Steps:
1. Click "🔐 Security" tab
2. Fill in password form:
   - **Current Password**: password123
   - **New Password**: newpassword123
   - **Confirm Password**: newpassword123
3. Click "🔐 Change Password"

### Expected Results:
- ✅ Success message: "Password changed successfully!"
- ✅ Form clears
- ✅ Fields become blank
- ✅ New password active in database

### Verification:
1. Click "🚪 Logout"
2. Try login with old password → Should fail
3. Try login with new password → Should succeed

---

## Test 6: Test Account Activity Tab

### Steps:
1. Click "📊 Activity" tab
2. Verify display:
   - Account created date
   - Last login info
   - Link to "View My Orders"

### Expected Results:
- ✅ All info displays correctly
- ✅ "View My Orders →" link works
- ✅ Clicking link navigates to `/orders`

---

## Test 7: View My Orders

### After placing an order first:
1. Click "📦 My Orders" in user menu
2. Navigate to `/orders` page

### Expected Display:
- ✅ Page title "📦 My Orders"
- ✅ Order count displayed
- ✅ Order cards show:
  - Order #[ID]
  - Order date/time
  - Status badge with icon
  - Shipping address
  - "View Items ▼" button

### Test Expanding Order:
1. Click "View Items ▼" on an order
2. Verify displays:
   - Product Name | Qty | Price | Total
   - [Product rows]
   - Total amount

### Expected Results:
- ✅ Items expand/collapse smoothly
- ✅ All product details display
- ✅ Math is correct (Qty × Price = Total)
- ✅ Can collapse again

---

## Test 8: Test Empty Orders State

### If user has no orders:
1. Navigate to `/orders`
2. Should see:
   - 📭 Emoji
   - "No Orders Yet"
   - "You haven't placed any orders yet."
   - "Continue Shopping" button (links to /products)

### Expected Results:
- ✅ Empty state displays correctly
- ✅ Link to continue shopping works

---

## Test 9: Mobile Validation

### Test Invalid Mobile During Signup:
1. Navigate to `/signup`
2. Try mobile values:
   - "123" (too short) → Should show error
   - "12345678901" (too long) → Should not allow input
   - "abcd123456" (letters) → Should show error
   - "9876543210" (valid) → Should allow

### Test Invalid Mobile on Profile:
1. Go to Profile → Account Info → Edit
2. Change mobile to:
   - "" (empty) → Should allow (optional)
   - "123" (too short) → Should show error on save
   - "9876543210" (valid) → Should save

### Expected Results:
- ✅ Validation errors show clearly
- ✅ Cannot submit with invalid mobile
- ✅ Valid mobile saves successfully

---

## Test 10: Mobile Responsiveness

### Desktop (1024px+):
1. Resize browser to full width
2. Verify:
   - Profile tabs in sidebar
   - Content takes full width
   - Cards have proper spacing

### Tablet (768px - 1023px):
1. Resize to 768px
2. Verify:
   - Profile tabs stack vertically
   - Content is still readable
   - Buttons sized for touch

### Mobile (< 480px):
1. Resize to 375px (mobile width)
2. Verify:
   - Single column layout
   - All content visible without scrolling horizontally
   - Buttons are touch-friendly size
   - Text is readable

### Expected Results:
- ✅ Layout adapts to screen size
- ✅ No horizontal scrolling needed
- ✅ All elements accessible on mobile
- ✅ Touch targets > 48px

---

## Test 11: Error Handling

### Test Missing Current Password:
1. Go to Profile → Security
2. Leave "Current Password" empty
3. Fill "New Password" and "Confirm Password"
4. Click "Change Password"

### Expected:
- ❌ Error: "Current password is required"

### Test Password Mismatch:
1. Current Password: password123
2. New Password: newpass123
3. Confirm Password: differentpass
4. Click "Change Password"

### Expected:
- ❌ Error: "Passwords do not match"

### Test Short Password:
1. Current Password: password123
2. New Password: pass
3. Confirm Password: pass
4. Click "Change Password"

### Expected:
- ❌ Error: "New password must be at least 6 characters"

---

## Test 12: Protected Routes

### Test Without Authentication:
1. Open new incognito window
2. Try to access `/orders` → Should redirect to login
3. Try to access `/profile` → Should redirect to login

### Test After Logout:
1. Go to user menu → Click "🚪 Logout"
2. Try to access `/orders` → Should redirect to login
3. Try to access `/profile` → Should redirect to login

### Expected Results:
- ✅ Routes are protected
- ✅ Non-authenticated users redirected to login
- ✅ After logout, pages become inaccessible

---

## Test 13: API Endpoints

### Test Profile Endpoint:
```bash
# Use curl or Postman
curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:5500/api/profile
```

**Expected Response:**
```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "john@example.com",
  "mobile": "9123456789",
  "role": "user",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Test Orders Endpoint:
```bash
curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:5500/api/orders/user/my-orders
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "status": "delivered",
    "total_amount": "1999.99",
    "created_at": "2024-01-10T15:20:00Z",
    "shipping_info": {...},
    "items": [
      {
        "id": 1,
        "product_name": "Product Name",
        "quantity": 2,
        "price": "999.99"
      }
    ]
  }
]
```

---

## Test 14: Cross-Browser Testing

Test in these browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Expected Results:
- ✅ All features work in all browsers
- ✅ CSS animations smooth
- ✅ Forms responsive
- ✅ No console errors

---

## Debugging Commands

### Check Frontend Errors:
Open browser console (F12) and look for:
- JavaScript errors
- Network request failures
- CSS warnings

### Check Backend Errors:
In backend terminal, look for:
- SQL errors
- JWT verification failures
- Route not found errors

### Test API Endpoint:
```bash
# From backend folder
node
const fetch = require('node-fetch');
fetch('http://localhost:5500/api/profile', {
  headers: {'Authorization': 'Bearer [token]'}
}).then(r => r.json()).then(console.log);
```

---

## ✅ Test Completion Checklist

- [ ] Can signup with mobile number
- [ ] Mobile saves to database
- [ ] Can login with created account
- [ ] Can access profile page
- [ ] Profile shows all user info with mobile
- [ ] Can edit name and mobile
- [ ] Can change password successfully
- [ ] Can view account activity
- [ ] Can view orders (if exist)
- [ ] Empty state shows when no orders
- [ ] Mobile field validates correctly
- [ ] Routes are protected
- [ ] Mobile responsive on all sizes
- [ ] No console errors
- [ ] All animations work smoothly
- [ ] Error messages display correctly

---

## Known Issues & Solutions

### Issue: Mobile field not saving
**Solution:** Check database has mobile column added
```sql
ALTER TABLE users ADD COLUMN mobile VARCHAR(20);
```

### Issue: Orders page shows empty
**Solution:** Make sure orders exist in database
```sql
SELECT * FROM orders WHERE user_id = [current_user_id];
```

### Issue: Profile page won't load
**Solution:** Check JWT token in localStorage
- Open DevTools → Application → Local Storage
- Verify "token" key exists and has value

### Issue: Password change fails
**Solution:** Verify password validation
- Old password must be correct
- New password minimum 6 characters
- Passwords must match

---

## Support

For issues, check:
1. Console errors (F12)
2. Network tab for failed requests
3. Backend logs for API errors
4. Database for data persistence

---

**Status:** ✅ Ready for Testing
**Version:** 1.0
**Last Updated:** Session 5
