'use strict';

const assert = require('node:assert/strict');
const { mkdtemp, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { JsonTradeStore } = require('../src/services/tradeStore');
const { TradingRuntime } = require('../src/services/tradingRuntime');
const { createDashboardServer, listen } = require('../src/web/server');

test('trade store persists runs, executions, and portfolio', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'trading-store-'));
  const store = new JsonTradeStore(path.join(directory, 'state.json'));

  await store.appendRun({
    id: 'run-test',
    mode: 'paper-execution',
    decision: { action: 'buy' },
    execution: {
      id: 'paper-1',
      status: 'filled',
      symbol: 'AAPL',
      side: 'buy',
      quantity: 1,
      fillPrice: 100,
      notional: 100,
      timestamp: '2026-01-01T00:00:00.000Z'
    },
    portfolio: {
      cash: 9900,
      equity: 10000,
      positions: {
        AAPL: {
          symbol: 'AAPL',
          quantity: 1,
          averagePrice: 100,
          markPrice: 100
        }
      }
    }
  });

  const state = await store.load();
  assert.equal(state.runs.length, 1);
  assert.equal(state.trades.length, 1);
  assert.equal(state.trades[0].symbol, 'AAPL');
  assert.equal(state.portfolio.positions.AAPL.quantity, 1);

  await rm(directory, { recursive: true, force: true });
});

test('runtime persists paper executions across runs', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'trading-runtime-'));
  const store = new JsonTradeStore(path.join(directory, 'state.json'));
  const runtime = new TradingRuntime({
    store,
    symbol: 'AAPL',
    execute: true,
    minConfidence: 0.35
  });

  const run = await runtime.runOnce({ execute: true });
  const state = await runtime.getState();

  assert.equal(run.execution.status, 'filled');
  assert.equal(state.trades.length, 1);
  assert.equal(state.runs.length, 1);
  assert.ok(state.portfolio.positions.AAPL.quantity > 0);

  await rm(directory, { recursive: true, force: true });
});

test('dashboard API exposes status, manual runs, and scheduler controls', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'trading-dashboard-'));
  const store = new JsonTradeStore(path.join(directory, 'state.json'));
  const runtime = new TradingRuntime({
    store,
    execute: true,
    symbol: 'DASH'
  });
  const server = createDashboardServer(runtime);
  await listen(server, { host: '127.0.0.1', port: 0 });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    let response = await fetch(`${baseUrl}/api/status`);
    let payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.trades.length, 0);

    response = await fetch(`${baseUrl}/api/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ execute: true })
    });
    payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.execution.status, 'filled');

    response = await fetch(`${baseUrl}/api/scheduler/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ execute: false, scheduleMs: 60000 })
    });
    payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.scheduler.enabled, true);

    response = await fetch(`${baseUrl}/api/scheduler/stop`, { method: 'POST' });
    payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.scheduler.enabled, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
