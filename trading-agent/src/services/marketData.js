'use strict';

const fs = require('node:fs/promises');

async function loadMarketSnapshot(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const snapshot = JSON.parse(raw);
  return normalizeSnapshot(snapshot);
}

function createDemoSnapshot(symbol = 'DEMO') {
  const closes = [
    94.1, 94.4, 94.9, 95.2, 95.8,
    96.1, 96.6, 97.4, 98.1, 98.8,
    99.3, 100.2, 101.1, 101.8, 102.6,
    103.4, 104.1, 104.9, 105.7, 106.5,
    107.4, 108.2, 109.1, 110.3, 111.2
  ];

  return {
    symbol,
    sentimentScore: 0.25,
    aiSignal: {
      direction: 'bullish',
      confidence: 0.72,
      rationale: 'Demo model sees improving momentum and positive trend persistence.'
    },
    candles: closes.map((close, index) => ({
      time: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      open: round(close - 0.4, 2),
      high: round(close + 0.8, 2),
      low: round(close - 0.9, 2),
      close,
      volume: 1000000 + (index * 25000)
    }))
  };
}

function normalizeSnapshot(snapshot) {
  return {
    ...snapshot,
    symbol: String(snapshot.symbol || '').toUpperCase(),
    sentimentScore: Number(snapshot.sentimentScore || 0),
    candles: (snapshot.candles || []).map((candle) => ({
      ...candle,
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume || 0)
    }))
  };
}

function round(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

module.exports = {
  loadMarketSnapshot,
  createDemoSnapshot,
  normalizeSnapshot
};
