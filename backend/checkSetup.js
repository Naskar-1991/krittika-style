#!/usr/bin/env node

/**
 * Frontend-Backend Connectivity Test
 * This script helps diagnose if frontend can communicate with backend
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Frontend-Backend Connectivity Diagnostic\n');

// Check if we're in the right directory
const backendPath = path.join(__dirname, '../backend');
const frontendPath = path.join(__dirname, '../src');

console.log(`📁 Backend path: ${backendPath}`);
console.log(`📁 Frontend path: ${frontendPath}\n`);

// Check .env exists in backend
console.log('📋 Checking backend configuration...\n');
const envPath = path.join(backendPath, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file found in backend');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').filter(l => l && !l.startsWith('#'));
    lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key) {
            const display = value ? '●●●' : '(empty)';
            console.log(`   ${key} = ${display}`);
        }
    });
} else {
    console.log('❌ .env file NOT found in backend');
    console.log('   Fix: Create backend/.env with database credentials');
}

// Check if backend API_URL is configured in frontend
console.log('\n📋 Checking frontend API configuration...\n');
const apiConnPath = path.join(frontendPath, 'api_connection/BackendAPIConnection.js');
if (fs.existsSync(apiConnPath)) {
    console.log('✅ BackendAPIConnection.js found');
    const content = fs.readFileSync(apiConnPath, 'utf8');
    const match = content.match(/API_URL\s*=\s*['"`]([^'"`]+)['"`]/);
    if (match) {
        console.log(`   API_URL = ${match[1]}`);
        if (match[1].includes('localhost:5500')) {
            console.log('   ✅ Correctly pointing to localhost:5500');
        } else {
            console.log(`   ⚠️  Unusual API_URL: ${match[1]}`);
        }
    } else {
        console.log('   ⚠️  Could not find API_URL definition');
    }
} else {
    console.log('❌ BackendAPIConnection.js NOT found');
}

// Check reviews route
console.log('\n📋 Checking reviews route registration...\n');
const serverPath = path.join(backendPath, 'server.js');
if (fs.existsSync(serverPath)) {
    console.log('✅ server.js found');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    if (serverContent.includes('require("./routes/reviews")') || serverContent.includes("require('./routes/reviews')")) {
        console.log('   ✅ Reviews route imported');
    } else {
        console.log('   ❌ Reviews route NOT imported');
        console.log('      Add: const reviewsRoute = require("./routes/reviews");');
    }
    
    if (serverContent.includes('/api/reviews')) {
        console.log('   ✅ Reviews route registered');
    } else {
        console.log('   ❌ Reviews route NOT registered');
        console.log('      Add: app.use("/api/reviews", reviewsRoute);');
    }
} else {
    console.log('❌ server.js NOT found');
}

// Check ReviewsList component
console.log('\n📋 Checking frontend review components...\n');
const componentsPath = path.join(frontendPath, 'components');
const reviewsFiles = [
    'ReviewsList.js',
    'ReviewForm.js',
    'RatingSummary.js'
];

reviewsFiles.forEach(file => {
    const filePath = path.join(componentsPath, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('API_URL')) {
            console.log(`   ✅ Uses API_URL`);
        } else if (content.includes('http://localhost:5500')) {
            console.log(`   ✅ Has hardcoded API URL`);
        } else {
            console.log(`   ⚠️  No API URL found`);
        }
    } else {
        console.log(`❌ ${file} NOT found`);
    }
});

// Summary
console.log('\n═══════════════════════════════════════════════════\n');
console.log('📋 Quick Start Instructions:\n');
console.log('Terminal 1 - Check Database:');
console.log('  cd backend');
console.log('  node verifyReviewsSetup.js\n');

console.log('Terminal 2 - Start Backend:');
console.log('  cd backend');
console.log('  node server.js\n');

console.log('Terminal 3 - Test API:');
console.log('  cd backend');
console.log('  node testReviewsAPI.js\n');

console.log('Terminal 4 - Start Frontend:');
console.log('  cd krittika-style');
console.log('  npm start\n');

console.log('Then:');
console.log('  1. Open http://localhost:3000');
console.log('  2. Log in');
console.log('  3. Go to product page');
console.log('  4. Press F12 (Developer Tools)');
console.log('  5. Look for reviews components\n');

console.log('═══════════════════════════════════════════════════\n');
