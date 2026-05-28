'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { TradingAgent } = require('../src/agents/tradingAgent');
const { PaperBroker } = require('../src/services/paperBroker');
const { createDemoSnapshot } = require('../src/services/marketData');
const { parseArgs } = require('../src/index');

test('creates a buy order for a confident bullish signal', () => {
  const agent = new TradingAgent();
  const snapshot = createDemoSnapshot('AAPL');
  const decision = agent.analyze(snapshot, {
    cash: 10000,
    equity: 10000,
    positions: {}
  });

  assert.equal(decision.action, 'buy');
  assert.equal(decision.order.side, 'buy');
  assert.equal(decision.order.symbol, 'AAPL');
  assert.ok(decision.confidence >= 0.35);
  assert.ok(decision.order.maxNotional <= 2500);
});

test('holds when the composite score is below the confidence threshold', () => {
  const agent = new TradingAgent({
    config: {
      strategy: {
        minConfidence: 0.9
      }
    }
  });
  const snapshot = createDemoSnapshot('MSFT');
  const decision = agent.analyze(snapshot, {
    cash: 10000,
    equity: 10000,
    positions: {}
  });

  assert.equal(decision.action, 'hold');
  assert.equal(decision.order, null);
});

test('sells an existing position when stop loss is triggered', () => {
  const agent = new TradingAgent();
  const snapshot = createDemoSnapshot('TSLA');
  snapshot.candles[snapshot.candles.length - 1].close = 90;

  const decision = agent.analyze(snapshot, {
    cash: 1000,
    equity: 2000,
    positions: {
      TSLA: {
        symbol: 'TSLA',
        quantity: 5,
        averagePrice: 100,
        markPrice: 90
      }
    }
  });

  assert.equal(decision.action, 'sell');
  assert.equal(decision.order.side, 'sell');
  assert.equal(decision.order.quantity, 5);
  assert.match(decision.reason, /Stop loss/);
});

test('paper broker fills orders and updates portfolio state', async () => {
  const broker = new PaperBroker({ startingCash: 1000 });

  await broker.executeOrder({
    symbol: 'AAPL',
    side: 'buy',
    type: 'market',
    quantity: 2,
    estimatedPrice: 100,
    reason: 'test'
  });
  let portfolio = await broker.getPortfolio();

  assert.equal(portfolio.cash, 800);
  assert.equal(portfolio.positions.AAPL.quantity, 2);

  await broker.executeOrder({
    symbol: 'AAPL',
    side: 'sell',
    type: 'market',
    quantity: 1,
    estimatedPrice: 110,
    reason: 'test'
  });
  portfolio = await broker.getPortfolio();

  assert.equal(portfolio.cash, 910);
  assert.equal(portfolio.positions.AAPL.quantity, 1);
});

test('agent run executes through the paper broker only', async () => {
  const broker = new PaperBroker({ startingCash: 10000 });
  const agent = new TradingAgent({ broker });
  const result = await agent.run(createDemoSnapshot('NVDA'));

  assert.equal(result.execution.status, 'filled');
  assert.equal(result.execution.side, 'buy');

  const portfolio = await broker.getPortfolio();
  assert.ok(portfolio.positions.NVDA.quantity > 0);
});

test('CLI parser supports demo and seeded positions', () => {
  const options = parseArgs([
    '--demo',
    '--symbol',
    'ibm',
    '--cash',
    '5000',
    '--position',
    'IBM:3:125.50'
  ]);

  assert.equal(options.demo, true);
  assert.equal(options.symbol, 'IBM');
  assert.equal(options.cash, 5000);
  assert.deepEqual(options.positions.IBM, {
    symbol: 'IBM',
    quantity: 3,
    averagePrice: 125.5,
    markPrice: 125.5
  });
});
