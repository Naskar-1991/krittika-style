#!/usr/bin/env node

/**
 * API Endpoint Testing Script for Reviews System
 * Run this to verify all review API endpoints are working
 */

const API_URL = process.env.API_URL || 'http://localhost:5500';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(type, message) {
    const time = new Date().toLocaleTimeString();
    if (type === 'success') {
        console.log(`${colors.green}✅ [${time}]${colors.reset} ${message}`);
    } else if (type === 'error') {
        console.log(`${colors.red}❌ [${time}]${colors.reset} ${message}`);
    } else if (type === 'info') {
        console.log(`${colors.blue}ℹ️  [${time}]${colors.reset} ${message}`);
    } else if (type === 'test') {
        console.log(`${colors.cyan}🧪 [${time}]${colors.reset} ${message}`);
    } else if (type === 'warn') {
        console.log(`${colors.yellow}⚠️  [${time}]${colors.reset} ${message}`);
    }
}

async function testEndpoint(name, method, endpoint, options = {}) {
    log('test', `Testing: ${method} ${endpoint}`);
    
    try {
        const url = `${API_URL}${endpoint}`;
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            body: options.body,
        });

        const contentType = response.headers.get('content-type');
        let data = null;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (response.ok) {
            log('success', `${name}: ${response.status} ${response.statusText}`);
            if (data && typeof data === 'object') {
                console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
            }
            return { success: true, status: response.status, data };
        } else {
            log('error', `${name}: ${response.status} ${response.statusText}`);
            console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
            return { success: false, status: response.status, data };
        }
    } catch (err) {
        log('error', `${name}: ${err.message}`);
        return { success: false, error: err.message };
    }
}

async function runTests() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}         Reviews API Endpoint Test Suite${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    log('info', `API URL: ${API_URL}`);
    log('info', 'Starting tests...\n');

    const results = {
        passed: 0,
        failed: 0,
        tests: [],
    };

    // Test 1: Check if backend is running
    log('test', 'Checking backend connectivity...');
    try {
        const response = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        }).catch(() => ({ ok: false }));

        if (response.ok) {
            log('success', 'Backend is running');
            results.passed++;
        } else {
            log('warn', 'Health check not available, but trying endpoints anyway...');
        }
    } catch (err) {
        log('error', `Cannot reach backend at ${API_URL}`);
        log('error', 'Make sure backend is running: cd backend && node server.js');
        return;
    }

    // Test 2: Get rating stats for a product
    console.log('\n--- Testing Stats Endpoints ---\n');
    let statsResult = await testEndpoint(
        'GET /api/reviews/stats/:productId',
        'GET',
        '/api/reviews/stats/1'
    );
    if (statsResult.success) results.passed++;
    else results.failed++;
    results.tests.push({ name: 'GET /api/reviews/stats/1', ...statsResult });

    // Test 3: Get product reviews
    console.log('\n--- Testing Reviews List Endpoints ---\n');
    let reviewsResult = await testEndpoint(
        'GET /api/reviews/product/:productId',
        'GET',
        '/api/reviews/product/1?sortBy=recent'
    );
    if (reviewsResult.success) results.passed++;
    else results.failed++;
    results.tests.push({ name: 'GET /api/reviews/product/1', ...reviewsResult });

    // Test 4: Get all reviews (unprotected)
    let allReviewsResult = await testEndpoint(
        'GET /api/reviews/all',
        'GET',
        '/api/reviews/all'
    );
    if (allReviewsResult.success) results.passed++;
    else results.failed++;
    results.tests.push({ name: 'GET /api/reviews/all', ...allReviewsResult });

    // Test 5: Check if creating review requires auth
    console.log('\n--- Testing Authentication ---\n');
    let noAuthResult = await testEndpoint(
        'POST /api/reviews (without token)',
        'POST',
        '/api/reviews',
        {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: 1,
                rating: 5,
                title: 'Test Review',
                reviewText: 'This is a test review',
            }),
        }
    );
    
    if (noAuthResult.status === 401 || noAuthResult.status === 403) {
        log('success', 'Auth protection working (requires token)');
        results.passed++;
    } else if (noAuthResult.success) {
        log('warn', 'Review created without auth (might be security issue)');
        results.failed++;
    } else {
        log('info', 'Create review endpoint responding');
        results.passed++;
    }
    results.tests.push({ name: 'POST /api/reviews (auth check)', ...noAuthResult });

    // Test 6: Admin endpoints
    console.log('\n--- Testing Admin Endpoints (without auth) ---\n');
    let adminAllResult = await testEndpoint(
        'GET /api/reviews/admin/all (without admin token)',
        'GET',
        '/api/reviews/admin/all'
    );
    if (adminAllResult.status === 401 || adminAllResult.status === 403) {
        log('success', 'Admin routes protected (requires admin token)');
        results.passed++;
    } else {
        log('warn', 'Admin route accessible without auth');
        results.failed++;
    }
    results.tests.push({ name: 'GET /api/reviews/admin/all (auth check)', ...adminAllResult });

    let adminStatsResult = await testEndpoint(
        'GET /api/reviews/admin/stats/overview (without admin token)',
        'GET',
        '/api/reviews/admin/stats/overview'
    );
    if (adminStatsResult.status === 401 || adminStatsResult.status === 403) {
        log('success', 'Admin stats protected (requires admin token)');
        results.passed++;
    } else {
        log('warn', 'Admin stats endpoint accessible without auth');
        results.failed++;
    }
    results.tests.push({ name: 'GET /api/reviews/admin/stats/overview (auth check)', ...adminStatsResult });

    // Summary
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}                     Test Summary${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    log('info', `Total Tests: ${results.passed + results.failed}`);
    log('success', `Passed: ${results.passed}`);
    if (results.failed > 0) {
        log('error', `Failed: ${results.failed}`);
    }

    console.log(`\n${colors.cyan}Detailed Results:${colors.reset}`);
    results.tests.forEach((test, index) => {
        const status = test.success ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
        const status_code = test.status ? ` (${test.status})` : '';
        console.log(`  ${status} ${index + 1}. ${test.name}${status_code}`);
    });

    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    if (results.failed === 0) {
        log('success', 'All API endpoints are working! ✨');
        console.log('\nNext Steps:');
        console.log('  1. Log in to the frontend');
        console.log('  2. Go to a product page');
        console.log('  3. Click on the Review tab');
        console.log('  4. Submit a review and watch it appear!');
    } else {
        log('warn', 'Some endpoints failed. Check errors above.');
        console.log('\nTroubleshooting:');
        console.log('  • Verify backend is running: cd backend && node server.js');
        console.log('  • Check PostgreSQL is running: psql -U <user> -d <database>');
        console.log('  • Verify .env file has correct database credentials');
        console.log('  • Run: npm install (in backend folder)');
    }

    console.log('');
}

runTests().catch(err => {
    log('error', `Unexpected error: ${err.message}`);
    process.exit(1);
});
