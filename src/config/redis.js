/**
 * Redis cache configuration (optional — lookup cache falls back to in-memory).
 */
const redis = require('redis');

const enabled = process.env.REDIS_ENABLED !== 'false';

const client = enabled
  ? redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        reconnectStrategy: false
      }
    })
  : { isReady: false, get: async () => null, setEx: async () => {} };

if (enabled) {
  let loggedUnavailable = false;
  client.on('error', () => {
    if (!loggedUnavailable) {
      console.warn('Redis unavailable — using in-memory lookup cache');
      loggedUnavailable = true;
    }
  });

  client.on('connect', () => {
    console.log('✓ Connected to Redis');
  });

  client.connect().catch(() => {
    if (!loggedUnavailable) {
      console.warn('Redis unavailable — using in-memory lookup cache');
      loggedUnavailable = true;
    }
  });
}

module.exports = client;
