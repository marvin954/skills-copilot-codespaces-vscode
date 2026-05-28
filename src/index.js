#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { TradingAgent } = require('./agents/tradingAgent');
const { PaperBroker } = require('./services/paperBroker');
const { createDemoSnapshot, loadMarketSnapshot } = require('./services/marketData');

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const snapshot = options.demo
    ? createDemoSnapshot(options.symbol)
    : await loadMarketSnapshot(path.resolve(options.marketData));

  const broker = new PaperBroker({
    startingCash: options.cash,
    positions: options.positions
  });
  const agent = new TradingAgent({
    broker,
    config: {
      mode: 'paper',
      strategy: {
        minConfidence: options.minConfidence
      },
      risk: {
        maxPositionPercent: options.maxPositionPercent,
        maxOrderNotional: options.maxOrderNotional
      }
    }
  });

  const portfolio = await broker.getPortfolio();
  const result = options.execute
    ? await agent.run(snapshot, portfolio)
    : { decision: agent.analyze(snapshot, portfolio), execution: null };
  const finalPortfolio = await broker.getPortfolio();

  process.stdout.write(`${JSON.stringify({
    mode: options.execute ? 'paper-execution' : 'analysis-only',
    input: {
      symbol: snapshot.symbol,
      candles: snapshot.candles.length
    },
    ...result,
    portfolio: finalPortfolio
  }, null, 2)}\n`);
}

function parseArgs(args) {
  const options = {
    cash: Number(process.env.TRADING_AGENT_STARTING_CASH || 10000),
    demo: false,
    execute: false,
    marketData: process.env.MARKET_DATA_FILE,
    maxOrderNotional: Number(process.env.TRADING_AGENT_MAX_ORDER_NOTIONAL || 2500),
    maxPositionPercent: Number(process.env.TRADING_AGENT_MAX_POSITION_PERCENT || 0.2),
    minConfidence: Number(process.env.TRADING_AGENT_MIN_CONFIDENCE || 0.35),
    positions: {},
    symbol: process.env.TRADING_AGENT_SYMBOL || 'DEMO'
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case '--cash':
        options.cash = Number(readValue(args, index, arg));
        index += 1;
        break;
      case '--demo':
        options.demo = true;
        break;
      case '--execute':
        options.execute = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--market-data':
        options.marketData = readValue(args, index, arg);
        index += 1;
        break;
      case '--max-order-notional':
        options.maxOrderNotional = Number(readValue(args, index, arg));
        index += 1;
        break;
      case '--max-position-percent':
        options.maxPositionPercent = Number(readValue(args, index, arg));
        index += 1;
        break;
      case '--min-confidence':
        options.minConfidence = Number(readValue(args, index, arg));
        index += 1;
        break;
      case '--position':
        addPosition(options.positions, readValue(args, index, arg));
        index += 1;
        break;
      case '--symbol':
        options.symbol = readValue(args, index, arg).toUpperCase();
        index += 1;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.demo && !options.marketData && !options.help) {
    throw new Error('Provide --demo or --market-data <snapshot.json>.');
  }

  return options;
}

function readValue(args, index, flag) {
  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function addPosition(positions, value) {
  const [symbol, quantity, averagePrice] = value.split(':');
  if (!symbol || !quantity || !averagePrice) {
    throw new Error('--position must use SYMBOL:QUANTITY:AVERAGE_PRICE format.');
  }

  positions[symbol.toUpperCase()] = {
    symbol: symbol.toUpperCase(),
    quantity: Number(quantity),
    averagePrice: Number(averagePrice),
    markPrice: Number(averagePrice)
  };
}

function printHelp() {
  process.stdout.write(`Trading AI Agent

Usage:
  node src/index.js --demo [--execute]
  node src/index.js --market-data ./examples/market-snapshot.json [--execute]

Options:
  --cash <amount>                 Starting paper cash. Default: 10000
  --demo                          Use bundled demo market data.
  --execute                       Fill the suggested order in the paper broker.
  --market-data <file>            JSON market snapshot file.
  --max-order-notional <amount>   Maximum paper order size. Default: 2500
  --max-position-percent <ratio>  Maximum equity allocation per symbol. Default: 0.2
  --min-confidence <ratio>        Minimum signal confidence to trade. Default: 0.35
  --position SYMBOL:QTY:AVG       Seed a paper position, e.g. AAPL:10:182.50
  --symbol <symbol>               Demo symbol. Default: DEMO

This CLI is paper-trading only and does not connect to a live broker.
`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  parseArgs,
  main
};
