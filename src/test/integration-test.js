#!/usr/bin/env node
/**
 * Integration test & demo script
 * Tests all major API endpoints
 * Run: node src/test/integration-test.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const levelColors = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warn: colors.yellow,
    test: colors.cyan
  };
  console.log(`${levelColors[level] || colors.reset}[${level.toUpperCase()}]${colors.reset} ${message}`);
}

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  log('test', 'Starting Integration Tests');
  console.log('');
  let passed = 0, failed = 0;

  try {
    // Test 1: Health
    log('test', 'Test 1: Health Check');
    const health = await makeRequest('GET', '/health');
    if (health.status === 200) {
      log('success', '✓ Health check passed');
      passed++;
    } else {
      log('error', '✗ Health check failed');
      failed++;
    }

    // Test 2: Search
    log('test', 'Test 2: Property Search');
    const search = await makeRequest('POST', '/search', {
      city: 'Austin',
      state: 'TX',
      priceMax: 400000
    });
    if (search.status === 200 && search.body.success) {
      log('success', `✓ Search returned ${search.body.pagination?.total || 0} properties`);
      passed++;
    } else {
      log('error', '✗ Search failed');
      failed++;
    }

    // Test 3: ROI
    log('test', 'Test 3: ROI Calculator');
    const roi = await makeRequest('POST', '/calculator/roi', {
      purchasePrice: 250000,
      repairCosts: 50000,
      afterRepairValue: 400000,
      sellingCosts: 24000
    });
    if (roi.status === 200 && roi.body.success) {
      log('success', `✓ ROI: ${roi.body.data.calculations.roi}%`);
      passed++;
    } else {
      log('error', '✗ ROI failed');
      failed++;
    }

    console.log('');
    console.log('═'.repeat(50));
    log('test', `Tests Passed: ${passed}, Failed: ${failed}`);
    console.log('═'.repeat(50));
    
    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    log('error', `Error: ${error.message}`);
    process.exit(1);
  }
}

runTests();
