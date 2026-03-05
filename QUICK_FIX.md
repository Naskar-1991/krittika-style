# 🔧 Quick Fix: "Failed to fetch users" Error

## Problem
You're seeing "Failed to fetch users" error in the Admin Users page.

## Root Cause
The most common reasons are:
1. **You're not logged in** - No token in localStorage
2. **You're not an admin** - Your user account doesn't have admin role
3. **Database connection failed** - PostgreSQL not running or schema missing

## ✅ Quick Fix Steps

### Step 1: Verify Backend is Running
```bash
# Check if backend is running on port 5500
netstat -ano | findstr :5500

# If not running, start it:
cd backend
node server.js
```
Expected output: `Server running on port 5500`

### Step 2: Verify PostgreSQL is Running
```bash
# Windows - Check Services for PostgreSQL
# Or use PostgreSQL client:
psql -U postgres -d skart_db -c "\dt"

# If connection fails, PostgreSQL is not running
# Windows: Start PostgreSQL service from Services.msc
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Step 3: Create/Upgrade Admin User

**Option A: Using SQL (Fastest)**
```bash
# Open PostgreSQL and run:
psql -U postgres -d skart_db -f backend/SETUP_ADMIN.sql
```

This creates or updates the admin user:
- **Email:** admin@shopbhub.com
- **Password:** admin123

**Option B: Manual SQL**
```bash
# Connect to database
psql -U postgres -d skart_db

# Check if users table has data
SELECT id, name, email, role FROM users;

# If users exist, make one admin:
UPDATE users SET role='admin' WHERE id=1;

# Verify
SELECT * FROM users WHERE role='admin';
```

### Step 4: Login to Frontend

1. Go to http://localhost:3000
2. Click **Signup** or **Login**
3. Use credentials:
   - **Email:** admin@shopbhub.com
   - **Password:** admin123
4. After login, you'll see the admin link in navbar
5. Click **Admin** → **Users** to view the users management page

### Step 5: Verify It Works

Check browser console to see the token:
```javascript
// Open browser DevTools (F12) → Console
console.log(localStorage.getItem('token'))
// Should print a long JWT string starting with "eyJ..."
```

## 🧪 Test the API Directly

```bash
# Get your token from browser console first, then:
curl -X GET http://localhost:5500/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test the debug endpoint:
curl -X GET http://localhost:5500/api/users/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response:
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@shopbhub.com",
    "role": "admin",
    "created_at": "2026-03-02T..."
  }
]
```

## ❌ Still Not Working?

Check these in order:

### Issue: "No token found" error appears
**Solution:** You're not logged in
```
1. Click Signup to create account
2. Or use admin@shopbhub.com / admin123
3. After login, token is auto-saved to localStorage
```

### Issue: "Admin access required" error
**Solution:** Your user is not admin role
```bash
# In psql:
UPDATE users SET role='admin' WHERE email='your@email.com';
SELECT * FROM users WHERE email='your@email.com'; # Verify
# Then logout and login again
```

### Issue: Connection timeout / Cannot reach backend
**Solution:** Backend not running
```
1. Open new terminal
2. cd backend && node server.js
3. Verify: netstat -ano | findstr :5500
```

### Issue: "Database connection failed" in backend logs
**Solution:** PostgreSQL not running
```
1. Windows: Check Services → PostgreSQL
2. Mac: brew services start postgresql
3. Linux: sudo systemctl start postgresql
4. Test: psql -U postgres -c "\l" (shows databases)
```

### Issue: No tables in database
**Solution:** Schema not imported
```bash
# Run schema import:
psql -U postgres -d skart_db -f backend/DATABASE_SCHEMA.sql

# Verify tables created:
psql -U postgres -d skart_db -c "\dt"
# Should show: users, products, orders, order_items, cart
```

## 📝 Complete Setup Checklist

- [ ] PostgreSQL running (`psql --version` works)
- [ ] Database exists (`psql -l | grep skart_db`)
- [ ] Tables created (`psql -U postgres -d skart_db -c "\dt"`)
- [ ] Backend running (`netstat -ano | findstr :5500`)
- [ ] Frontend running (`netstat -ano | findstr :3000`)
- [ ] Admin user exists (`psql -U postgres -d skart_db -c "SELECT * FROM users WHERE role='admin';"`)
- [ ] Logged in as admin (token in console: `localStorage.getItem('token')`)
- [ ] Users page loads without error

## 🚀 Full Reset (Start Fresh)

If everything is broken, do a complete reset:

```bash
# 1. Kill all node processes
taskkill /F /IM node.exe

# 2. Delete node_modules and reinstall
cd frontend
rmdir /s /q node_modules
npm install

# 3. Reset database
psql -U postgres -c "DROP DATABASE skart_db;"
psql -U postgres -c "CREATE DATABASE skart_db;"
psql -U postgres -d skart_db -f backend/DATABASE_SCHEMA.sql

# 4. Start fresh
# Terminal 1:
cd backend && node server.js

# Terminal 2:
npm start

# 5. Signup as new user, then make admin:
psql -U postgres -d skart_db -c "UPDATE users SET role='admin' WHERE id=1;"
```

## 🆘 Need More Help?

Check the detailed documentation:
- Backend API: See `backend/routes/users.js`
- Frontend Component: See `src/admin/AdminUsers.js`
- Database Schema: See `backend/DATABASE_SCHEMA.sql`
- Full Docs: See `ADMIN_SETUP.md`

Run the troubleshooting script:
```bash
cd backend
node troubleshoot.js
```
