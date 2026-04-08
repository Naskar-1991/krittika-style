require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

async function verifyReviewsSetup() {
    try {
        await client.connect();
        console.log("✅ Connected to PostgreSQL\n");

        // Check if reviews table exists
        console.log("📋 Checking reviews table...");
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'reviews'
            ) as table_exists;
        `);

        if (!tableCheck.rows[0].table_exists) {
            console.log("❌ Reviews table does NOT exist!");
            console.log("Fix: Run 'node backend/runMigration.js' first\n");
            return;
        }
        console.log("✅ Reviews table exists\n");

        // Check table structure
        console.log("📐 Reviews table structure:");
        const columns = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'reviews'
            ORDER BY ordinal_position;
        `);
        console.table(columns.rows);

        // Check if admin columns exist
        console.log("\n🔍 Checking admin moderation columns...");
        const adminColumns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'reviews' 
            AND column_name IN ('is_flagged', 'flagged_at')
        `);

        if (adminColumns.rows.length > 0) {
            console.log("✅ Admin moderation columns exist");
        } else {
            console.log("⚠️  Admin moderation columns missing");
            console.log("Fix: Run 'node backend/runReviewMigration.js' to add them\n");
        }

        // Check data
        console.log("\n📊 Reviews data summary:");
        const stats = await client.query(`
            SELECT 
                COUNT(*) as total_reviews,
                COUNT(DISTINCT product_id) as products_with_reviews,
                COUNT(DISTINCT user_id) as users_with_reviews,
                AVG(rating)::NUMERIC(2,1) as avg_rating
            FROM reviews;
        `);

        const result = stats.rows[0];
        console.log(`Total reviews: ${result.total_reviews}`);
        console.log(`Products with reviews: ${result.products_with_reviews}`);
        console.log(`Users with reviews: ${result.users_with_reviews}`);
        console.log(`Average rating: ${result.avg_rating || 'N/A (no reviews)'}`);

        // Show sample reviews if any
        if (result.total_reviews > 0) {
            console.log("\n📝 Sample reviews (last 3):");
            const samples = await client.query(`
                SELECT r.id, r.rating, r.title, u.name, p.name as product
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN products p ON r.product_id = p.id
                ORDER BY r.created_at DESC
                LIMIT 3;
            `);
            console.table(samples.rows);
        } else {
            console.log("\n📝 No reviews yet (this is normal for new setup)");
        }

        console.log("\n✅ Reviews table setup verified!");

    } catch (err) {
        console.error("❌ Error verifying reviews setup:", err.message);
    } finally {
        await client.end();
    }
}

verifyReviewsSetup();
