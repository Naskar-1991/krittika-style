// Copy and paste this into your browser DevTools Console (F12) to test the API endpoints

const API_URL = "http://localhost:5500"; // Change if different
const PRODUCT_ID = 1; // Change to test different product

console.log("🔍 Testing Reviews API Endpoints...\n");

// Test 1: Get Rating Stats
console.log("📊 Test 1: Fetching Rating Stats...");
fetch(`${API_URL}/api/reviews/stats/${PRODUCT_ID}`)
  .then(res => res.json())
  .then(data => {
    console.log("✅ Rating Stats:", data);
    console.log(`   - Total Reviews: ${data.total_reviews}`);
    console.log(`   - Average Rating: ${data.average_rating}`);
  })
  .catch(err => console.error("❌ Error fetching stats:", err.message));

// Test 2: Get All Reviews for Product
console.log("\n📝 Test 2: Fetching Reviews for Product...");
fetch(`${API_URL}/api/reviews/product/${PRODUCT_ID}`)
  .then(res => res.json())
  .then(data => {
    console.log("✅ Reviews:", data);
    if (data.reviews.length > 0) {
      console.log(`   - Found ${data.reviews.length} review(s)`);
      console.log(`   - First review: "${data.reviews[0].title}"`);
    } else {
      console.log("   - No reviews yet (this is normal for new products)");
    }
  })
  .catch(err => console.error("❌ Error fetching reviews:", err.message));

// Test 3: Try to Create Review (requires auth token)
console.log("\n✍️  Test 3: Testing Review Creation...");
const token = localStorage.getItem("token");
if (!token) {
  console.warn("⚠️  No auth token found - you need to login first");
} else {
  console.log("✅ Auth token found, attempting to create test review...");
  
  fetch(`${API_URL}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: PRODUCT_ID,
      rating: 5,
      title: "Test Review from Console",
      review_text: "This is a test review created from browser console"
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.log("⚠️  Review creation response:", data.error);
      } else {
        console.log("✅ Review created:", data);
      }
    })
    .catch(err => console.error("❌ Error creating review:", err.message));
}

console.log("\n✨ Tests initiated. Results should appear above in a few seconds.");
console.log("📌 If you see errors, check the following:");
console.log("   1. Backend server running on port 5500?");
console.log("   2. REACT_APP_API_DEV_URL set to http://localhost:5500?");
console.log("   3. Are there CORS errors in console?");
