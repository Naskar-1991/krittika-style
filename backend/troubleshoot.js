#!/usr/bin/env node

/**
 * KrittikaStyle Admin Users Troubleshooting Script
 * Run this to diagnose "Failed to fetch users" errors
 * Usage: node troubleshoot.js
 */

const http = require("http");

console.log("\n🔍 KrittikaStyle Admin Users Troubleshooting\n");
console.log("=" .repeat(50));

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : body,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  // Test 1: Backend connectivity
  console.log("\n✓ Test 1: Backend Server Connectivity");
  console.log("-" .repeat(50));
  try {
    const res = await makeRequest({
      hostname: "localhost",
      port: 5500,
      path: "/api/users",
      method: "GET",
      headers: { Authorization: "Bearer invalid" },
    });
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${JSON.stringify(res.body)}\n`);

    if (res.status === 401) {
      console.log("✅ Backend is running and rejecting invalid tokens (correct behavior)\n");
    } else if (res.status === 500) {
      console.log("⚠️  Backend error - likely database connection issue");
      console.log("Ensure PostgreSQL is running and credentials in .env are correct\n");
    }
  } catch (err) {
    console.log(`❌ Cannot connect to backend at localhost:5500`);
    console.log(`Error: ${err.message}`);
    console.log(`\nSolution: Start backend with: cd backend && node server.js\n`);
    return;
  }

  // Test 2: Database check
  console.log("\n✓ Test 2: Database Schema");
  console.log("-" .repeat(50));
  console.log("Run the following SQL to verify tables exist:\n");
  console.log("psql -U postgres -d skart_db -c \"\\dt\"");
  console.log("\nExpected tables: users, products, orders, order_items, cart\n");

  // Test 3: Admin user check
  console.log("\n✓ Test 3: Check Admin User");
  console.log("-" .repeat(50));
  console.log("Run the following SQL to verify admin users exist:\n");
  console.log('psql -U postgres -d skart_db -c "SELECT id, name, email, role FROM users WHERE role=\'admin\';"');
  console.log("\nIf no results, create admin user or update existing:\n");
  console.log('psql -U postgres -d skart_db -c "UPDATE users SET role=\'admin\' WHERE email=\'your@email.com\';"');
  console.log();

  // Test 4: Frontend setup
  console.log("\n✓ Test 4: Frontend Token Check");
  console.log("-" .repeat(50));
  console.log("1. Login to the app at http://localhost:3000");
  console.log("2. Open browser DevTools (F12)");
  console.log("3. Go to Console tab");
  console.log(`4. Paste: console.log(localStorage.getItem('token'))`);
  console.log("5. You should see a JWT token (dark string starting with 'eyJ')");
  console.log("\nIf no token:\n");
  console.log("  - You're not logged in. Sign up or login first.");
  console.log("  - Try using test account: admin@shopbhub.com\n");

  // Test 5: API Test
  console.log("\n✓ Test 5: API Endpoint Testing");
  console.log("-" .repeat(50));
  console.log("Once logged in, test the API with:\n");
  console.log("curl -X GET http://localhost:5500/api/users \\");
  console.log('  -H "Authorization: Bearer YOUR_TOKEN_HERE"\n');
  console.log("Or use the debug endpoint to verify token:\n");
  console.log("curl -X GET http://localhost:5500/api/users/test \\");
  console.log('  -H "Authorization: Bearer YOUR_TOKEN_HERE"\n');

  // Summary
  console.log("\n" + "=" .repeat(50));
  console.log("\n📋 COMMON SOLUTIONS:\n");
  console.log("1. Backend not running?");
  console.log("   → cd backend && node server.js\n");

  console.log("2. PostgreSQL not running?");
  console.log("   → Windows: Use pgAdmin or services");
  console.log("   → Mac/Linux: brew services start postgresql\n");

  console.log("3. Tables don't exist?");
  console.log("   → psql -U postgres -d skart_db -f backend/DATABASE_SCHEMA.sql\n");

  console.log("4. Not logged in?");
  console.log("   → Go to /login, signup or login with credentials");
  console.log("   → Token will be stored in localStorage\n");

  console.log("5. User is not admin?");
  console.log("   → Database: UPDATE users SET role='admin' WHERE id=YOUR_USER_ID\n");

  console.log("6. CORS errors?");
  console.log("   → Check that backend has cors enabled (included in server.js)\n");

  console.log("=" .repeat(50) + "\n");
}

runTests().catch(console.error);
