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
        const migrationPath = path.join(__dirname, process.argv[2] || 'MIGRATION_ADD_REVIEWS.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log("\n📋 Running migration: MIGRATION_ADD_REVIEWS.sql...\n");
        
        // Execute migration
        await client.query(sql);
        
        console.log("✅ Migration completed successfully!");
        console.log("\n📊 Verifying tables...");
        
        // Verify the table was created
        const result = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'reviews'
            ) as table_exists;
        `);

        if (result.rows[0].table_exists) {
            console.log("✅ Reviews table created successfully");
            
            // Show table structure
            const columns = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'reviews'
                ORDER BY ordinal_position;
            `);
            
            console.log("\n📐 Reviews table structure:");
            console.table(columns.rows);
        } else {
            console.log("❌ Reviews table was not created");
        }

    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        console.error("\nFull error:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
