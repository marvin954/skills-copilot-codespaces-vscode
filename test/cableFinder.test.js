'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { test } = require('node:test');
const { parseArgs } = require('../src');
const { parseAddress } = require('../src/services/addressParser');
const { findAvailability } = require('../src/services/availability');
const { createCableFinderServer } = require('../src/server');

test('parses a customer street address into lookup fields', () => {
  const address = parseAddress('1200 Main St, Springfield, IL 62704');

  assert.equal(address.zip, '62704');
  assert.equal(address.city, 'springfield');
  assert.equal(address.state, 'IL');
  assert.ok(address.tokens.includes('main'));
});

test('finds residential fiber and cable services at a covered address', () => {
  const result = findAvailability('1200 Main St, Springfield, IL 62704');
  const serviceIds = result.services.map((service) => service.id);

  assert.deepEqual(serviceIds, ['metro-fiber-gig', 'metro-coax']);
  assert.match(result.summary, /2 internet services available/);
  assert.equal(result.services[0].tiers.at(-1).downloadMbps, 1000);
});

test('finds business services when the address includes a suite', () => {
  const result = findAvailability('88 Commerce Plaza Suite 400, Springfield, IL 62701');
  const serviceIds = result.services.map((service) => service.id);

  assert.ok(serviceIds.includes('enterprise-dia'));
  assert.ok(serviceIds.includes('metro-coax'));
  assert.equal(result.services.find((service) => service.id === 'enterprise-dia').confidence, 'high');
});

test('returns an empty result when the catalog has no active coverage', () => {
  const result = findAvailability('1 Remote Farm Road, Nowhere, IL 99999');

  assert.deepEqual(result.services, []);
  assert.match(result.summary, /No active internet services/);
});

test('CLI parser supports address lookups and server options', () => {
  const options = parseArgs([
    '--address',
    '1200 Main St, Springfield, IL 62704',
    '--host',
    '0.0.0.0',
    '--port',
    '4173'
  ]);

  assert.equal(options.address, '1200 Main St, Springfield, IL 62704');
  assert.equal(options.host, '0.0.0.0');
  assert.equal(options.port, 4173);
});

test('HTTP API returns available services for browser searches', async () => {
  const server = createCableFinderServer();
  await listen(server);

  try {
    const response = await getJson(server, '/api/availability?address=1200%20Main%20St%2C%20Springfield%2C%20IL%2062704');

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.services.length, 2);
    assert.equal(response.body.services[0].provider, 'MetroLink Fiber');
  } finally {
    await close(server);
  }
});

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
}

function getJson(server, path) {
  const { port } = server.address();

  return new Promise((resolve, reject) => {
    const request = http.get({
      hostname: '127.0.0.1',
      port,
      path
    }, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          body: JSON.parse(raw)
        });
      });
    });

    request.on('error', reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
