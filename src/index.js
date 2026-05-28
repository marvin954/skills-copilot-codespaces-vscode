#!/usr/bin/env node
'use strict';

const { TradingRuntime } = require('./services/tradingRuntime');
const { JsonTradeStore } = require('./services/tradeStore');
const { createDashboardServer, listen } = require('./web/server');

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const store = new JsonTradeStore(options.stateFile);
  const runtime = new TradingRuntime({ ...options, store });

  if (options.resetState) {
    const state = await store.reset();
    process.stdout.write(`${JSON.stringify({ stateFile: store.filePath, state }, null, 2)}\n`);
    return;
  }

  if (options.history) {
    const state = await runtime.getState();
    process.stdout.write(`${JSON.stringify({ stateFile: store.filePath, ...state }, null, 2)}\n`);
    return;
  }

  if (options.serve) {
    const server = createDashboardServer(runtime);
    await listen(server, { host: options.host, port: options.port });
    process.stdout.write(`Trading AI Agent dashboard: http://${options.host}:${options.port}\n`);
    process.stdout.write(`State file: ${store.filePath}\n`);
    return;
  }

  const run = await runtime.runOnce({ execute: options.execute });
  const state = await runtime.getState();

  process.stdout.write(`${JSON.stringify({
    stateFile: store.filePath,
    run,
    portfolio: state.portfolio,
    tradeCount: state.trades.length,
    runCount: state.runs.length
  }, null, 2)}\n`);
}

function parseArgs(args) {
  const options = {
    cash: Number(process.env.TRADING_AGENT_STARTING_CASH || 10000),
    demo: false,
    execute: false,
    history: false,
    host: process.env.TRADING_AGENT_HOST || '127.0.0.1',
    marketData: process.env.MARKET_DATA_FILE,
    maxOrderNotional: Number(process.env.TRADING_AGENT_MAX_ORDER_NOTIONAL || 2500),
    maxPositionPercent: Number(process.env.TRADING_AGENT_MAX_POSITION_PERCENT || 0.2),
    minConfidence: Number(process.env.TRADING_AGENT_MIN_CONFIDENCE || 0.35),
    port: Number(process.env.TRADING_AGENT_PORT || 3000),
    positions: {},
    resetState: false,
    scheduleMs: Number(process.env.TRADING_AGENT_SCHEDULE_MS || 60000),
    serve: false,
    stateFile: process.env.TRADING_AGENT_STATE_FILE,
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
      case '--history':
        options.history = true;
        break;
      case '--host':
        options.host = readValue(args, index, arg);
        index += 1;
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
      case '--port':
        options.port = Number(readValue(args, index, arg));
        index += 1;
        break;
      case '--position':
        addPosition(options.positions, readValue(args, index, arg));
        index += 1;
        break;
      case '--reset-state':
        options.resetState = true;
        break;
      case '--schedule-ms':
        options.scheduleMs = Number(readValue(args, index, arg));
        index += 1;
        break;
      case '--serve':
        options.serve = true;
        break;
      case '--state-file':
        options.stateFile = readValue(args, index, arg);
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

  if (options.serve && !options.marketData) {
    options.demo = true;
  }

  if (!options.demo && !options.marketData && !options.help && !options.history && !options.resetState) {
    throw new Error('Provide --demo, --serve, --history, or --market-data <snapshot.json>.');
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
  node src/index.js --serve --demo
  node src/index.js --history

Options:
  --cash <amount>                 Starting paper cash for a new state file. Default: 10000
  --demo                          Use bundled demo market data.
  --execute                       Fill the suggested order in the paper broker.
  --history                       Print persisted portfolio, trades, and runs.
  --host <host>                   Dashboard host. Default: 127.0.0.1
  --market-data <file>            JSON market snapshot file.
  --max-order-notional <amount>   Maximum paper order size. Default: 2500
  --max-position-percent <ratio>  Maximum equity allocation per symbol. Default: 0.2
  --min-confidence <ratio>        Minimum signal confidence to trade. Default: 0.35
  --port <port>                   Dashboard port. Default: 3000
  --position SYMBOL:QTY:AVG       Seed or override a paper position for the next run.
  --reset-state                   Reset the persistent state file.
  --schedule-ms <milliseconds>    Scheduler interval. Default: 60000
  --serve                         Start the web dashboard and API.
  --state-file <file>             Persistent state file. Default: .trading-agent/state.json
  --symbol <symbol>               Demo symbol. Default: DEMO

Dashboard API:
  GET  /api/status
  GET  /api/history
  POST /api/run
  POST /api/scheduler/start
  POST /api/scheduler/stop

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
