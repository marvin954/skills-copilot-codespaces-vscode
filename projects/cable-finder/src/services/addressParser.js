'use strict';

const STATE_PATTERN = /\b[A-Z]{2}\b/g;
const ZIP_PATTERN = /\b\d{5}(?:-\d{4})?\b/;
const UNIT_PATTERN = /\b(?:apt|apartment|unit|suite|ste|floor|fl|building|bldg)\s+[a-z0-9-]+\b/i;
const BUSINESS_KEYWORDS = new Set(['suite', 'ste', 'plaza', 'commerce', 'industrial', 'business', 'office', 'floor']);

function parseAddress(input) {
  const original = String(input || '').trim();

  if (!original) {
    throw new TypeError('Address is required.');
  }

  const normalized = normalizeAddress(original);
  const zip = extractZip(original);
  const state = extractState(original);
  const unit = extractUnit(original);
  const parts = original.split(',').map((part) => part.trim()).filter(Boolean);
  const city = extractCity(parts, state, zip);
  const street = extractStreet(parts, original);
  const tokens = tokenize(normalized);
  const isBusinessAddress = tokens.some((token) => BUSINESS_KEYWORDS.has(token));

  return {
    original,
    normalized,
    street,
    city,
    state,
    zip,
    unit,
    tokens,
    isBusinessAddress
  };
}

function normalizeAddress(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractZip(value) {
  const match = String(value).match(ZIP_PATTERN);
  return match ? match[0].slice(0, 5) : null;
}

function extractState(value) {
  const matches = String(value).toUpperCase().match(STATE_PATTERN);
  if (!matches || matches.length === 0) {
    return null;
  }

  return matches.at(-1);
}

function extractUnit(value) {
  const match = String(value).match(UNIT_PATTERN);
  return match ? match[0] : null;
}

function extractStreet(parts, original) {
  if (parts.length > 1) {
    return parts[0];
  }

  return String(original).replace(ZIP_PATTERN, '').trim();
}

function extractCity(parts, state, zip) {
  if (parts.length >= 3) {
    return normalizeAddress(parts.at(-2));
  }

  if (parts.length === 2) {
    return normalizeAddress(parts[1].replace(ZIP_PATTERN, '').replace(state || '', ''));
  }

  if (!state && !zip) {
    return null;
  }

  return null;
}

function tokenize(value) {
  return normalizeAddress(value)
    .split(' ')
    .filter((token) => token && !/^\d+$/.test(token));
}

module.exports = {
  parseAddress,
  normalizeAddress,
  tokenize
};
