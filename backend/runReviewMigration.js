require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

async function runMigration() {
    try {
        await client.connect();
        console.log("✅ Connected to PostgreSQL");

        // Read migration file
        const migrationPath = path.join(__dirname, 'MIGRATION_ADD_REVIEW_MODERATION.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log("\n📋 Running migration: MIGRATION_ADD_REVIEW_MODERATION.sql...\n");
        
        // Execute migration
        await client.query(sql);
        
        console.log("✅ Migration completed successfully!");
        console.log("\n📊 Verifying columns...");
        
        // Verify the columns were added
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'reviews' 
            AND column_name IN ('is_flagged', 'flagged_at', 'flag_reason')
            ORDER BY ordinal_position;
        `);

        if (result.rows.length > 0) {
            console.log("✅ Review moderation columns added successfully:");
            console.table(result.rows);
        } else {
            console.log("⚠️  Columns might already exist or migration didn't run");
        }

    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log("ℹ️  Columns already exist, no changes needed");
        } else {
            console.error("❌ Migration failed:", err.message);
        }
    } finally {
        await client.end();
    }
}

runMigration();
