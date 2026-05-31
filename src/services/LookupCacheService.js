/**
 * Lightweight lookup cache — Redis when available, in-memory fallback.
 */
const crypto = require('crypto');
const redisClient = require('../config/redis');

const memoryCache = new Map();
const DEFAULT_TTL_SECONDS = parseInt(process.env.LOOKUP_CACHE_TTL_SECONDS || `${60 * 60 * 24 * 30}`, 10);

function buildAddressKey({ address, city, state, zipCode }) {
  const normalized = [address, city, state, zipCode]
    .map((part) => (part || '').trim().toLowerCase())
    .join('|');
  return `lookup:v1:${crypto.createHash('sha256').update(normalized).digest('hex')}`;
}

function liveIdKey(liveId) {
  return `lookup:live:${liveId}`;
}

async function get(key) {
  if (redisClient.isReady) {
    try {
      const value = await redisClient.get(key);
      if (value) return JSON.parse(value);
    } catch (error) {
      console.warn('Lookup cache read failed:', error.message);
    }
  }

  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

async function set(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const payload = JSON.stringify(value);

  if (redisClient.isReady) {
    try {
      await redisClient.setEx(key, ttlSeconds, payload);
    } catch (error) {
      console.warn('Lookup cache write failed:', error.message);
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

async function getLookupResult(input) {
  const addressKey = buildAddressKey(input);
  return get(addressKey);
}

async function saveLookupResult(input, result) {
  const addressKey = buildAddressKey(input);
  const ttlSeconds = DEFAULT_TTL_SECONDS;

  await set(addressKey, result, ttlSeconds);

  const liveId = result?.property?.id;
  if (liveId?.startsWith('live-')) {
    await set(liveIdKey(liveId), result, ttlSeconds);
  }
}

async function getByLiveId(liveId) {
  if (!liveId?.startsWith('live-')) return null;
  return get(liveIdKey(liveId));
}

module.exports = {
  buildAddressKey,
  getLookupResult,
  saveLookupResult,
  getByLiveId
};
