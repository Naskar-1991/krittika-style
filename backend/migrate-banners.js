require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { Pool } = require('pg');

const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'banners';

const local = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

const supabase = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function request(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = { method, hostname: u.hostname, path: u.pathname + u.search, headers };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function createBucket() {
  const res = await request(
    'POST',
    `${PROJECT_URL}/storage/v1/bucket`,
    { Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    JSON.stringify({ id: BUCKET, name: BUCKET, public: true })
  );
  if (res.status === 200 || res.status === 409) {
    console.log('  ✅ Storage bucket "banners" ready');
  } else {
    throw new Error(`Failed to create bucket: ${res.body}`);
  }
}

async function uploadImage(filename) {
  const filePath = path.join(__dirname, 'uploads', filename);
  const fileData = fs.readFileSync(filePath);
  const res = await request(
    'POST',
    `${PROJECT_URL}/storage/v1/object/${BUCKET}/${filename}`,
    {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    fileData
  );
  if (res.status === 200 || res.status === 201) {
    return `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
  }
  throw new Error(`Upload failed for ${filename}: ${res.body}`);
}

async function migrate() {
  if (!SERVICE_KEY || SERVICE_KEY === 'your_service_role_key_here') {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env');
    console.error('   Go to Supabase Dashboard → Settings → API → copy service_role key');
    process.exit(1);
  }

  try {
    console.log('📦 Setting up Supabase Storage bucket...');
    await createBucket();

    console.log('\n🖼️  Uploading banner images...');
    const { rows: banners } = await local.query('SELECT * FROM banners ORDER BY sort_order');

    const migrated = [];
    for (const banner of banners) {
      const filename = path.basename(banner.image_url); // e.g. banner-1779051822044.png
      const localFile = path.join(__dirname, 'uploads', filename);

      if (!fs.existsSync(localFile)) {
        console.log(`  ⚠️  File not found, skipping: ${filename}`);
        continue;
      }

      const publicUrl = await uploadImage(filename);
      migrated.push({ ...banner, image_url: publicUrl });
      console.log(`  ✅ Uploaded: ${filename}`);
    }

    console.log('\n💾 Migrating banner rows to Supabase DB...');
    await supabase.query('DELETE FROM banners');
    for (const b of migrated) {
      await supabase.query(
        `INSERT INTO banners (id, image_url, title, link_url, sort_order, is_active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [b.id, b.image_url, b.title || '', b.link_url || '', b.sort_order, b.is_active, b.created_at]
      );
    }
    await supabase.query(`SELECT setval(pg_get_serial_sequence('banners','id'), MAX(id)) FROM banners`);

    console.log(`\n🔍 Verifying...`);
    const { rows } = await supabase.query('SELECT id, image_url, sort_order FROM banners ORDER BY sort_order');
    rows.forEach(r => console.log(`  [${r.sort_order}] ${r.image_url}`));
    console.log(`\n🎉 ${migrated.length} banners migrated to Supabase Storage!`);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await Promise.all([local.end(), supabase.end()]);
  }
}

migrate();
