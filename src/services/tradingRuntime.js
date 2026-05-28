'use strict';

const path = require('node:path');
const { TradingAgent } = require('../agents/tradingAgent');
const { PaperBroker } = require('./paperBroker');
const { createDemoSnapshot, loadMarketSnapshot } = require('./marketData');
const { JsonTradeStore } = require('./tradeStore');

class TradingRuntime {
  constructor(options = {}) {
    this.options = {
      cash: Number(process.env.TRADING_AGENT_STARTING_CASH || 10000),
      demo: false,
      execute: false,
      marketData: process.env.MARKET_DATA_FILE,
      maxOrderNotional: Number(process.env.TRADING_AGENT_MAX_ORDER_NOTIONAL || 2500),
      maxPositionPercent: Number(process.env.TRADING_AGENT_MAX_POSITION_PERCENT || 0.2),
      minConfidence: Number(process.env.TRADING_AGENT_MIN_CONFIDENCE || 0.35),
      scheduleMs: Number(process.env.TRADING_AGENT_SCHEDULE_MS || 60000),
      symbol: process.env.TRADING_AGENT_SYMBOL || 'DEMO',
      ...options
    };
    this.store = options.store || new JsonTradeStore(options.stateFile);
    this.schedulerTimer = null;
  }

  async getState() {
    return this.store.load();
  }

  async getSnapshot() {
    if (this.options.marketData) {
      return loadMarketSnapshot(path.resolve(this.options.marketData));
    }

    return createDemoSnapshot(this.options.symbol);
  }

  async runOnce(overrides = {}) {
    const runOptions = { ...this.options, ...overrides };
    const state = await this.store.load();
    const isNewState = state.runs.length === 0 && state.trades.length === 0 && Object.keys(state.portfolio.positions || {}).length === 0;
    const seededPositions = Object.keys(runOptions.positions || {}).length > 0
      ? runOptions.positions
      : state.portfolio.positions;
    const startingCash = isNewState ? runOptions.cash : state.portfolio.cash;
    const broker = new PaperBroker({
      startingCash: Number(startingCash),
      positions: seededPositions
    });
    const agent = new TradingAgent({
      broker,
      config: {
        mode: 'paper',
        strategy: {
          minConfidence: runOptions.minConfidence
        },
        risk: {
          maxPositionPercent: runOptions.maxPositionPercent,
          maxOrderNotional: runOptions.maxOrderNotional
        }
      }
    });
    const snapshot = await this.getSnapshot();
    const startingPortfolio = await broker.getPortfolio();
    const result = runOptions.execute
      ? await agent.run(snapshot, startingPortfolio)
      : { decision: agent.analyze(snapshot, startingPortfolio), execution: null };
    const portfolio = await broker.getPortfolio();
    const run = {
      id: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: runOptions.execute ? 'paper-execution' : 'analysis-only',
      snapshot: {
        symbol: snapshot.symbol,
        candles: snapshot.candles.length,
        latestPrice: snapshot.candles.at(-1).close
      },
      decision: result.decision,
      execution: result.execution,
      portfolio
    };

    await this.store.appendRun(run);
    await this.store.updateScheduler({
      lastRunAt: run.timestamp,
      nextRunAt: this.schedulerTimer
        ? new Date(Date.now() + runOptions.scheduleMs).toISOString()
        : null
    });

    return run;
  }

  async startScheduler(overrides = {}) {
    const scheduleMs = Number(overrides.scheduleMs || this.options.scheduleMs);
    if (!Number.isFinite(scheduleMs) || scheduleMs < 1000) {
      throw new Error('Scheduler interval must be at least 1000 ms.');
    }

    this.stopScheduler({ persist: false });
    this.options = {
      ...this.options,
      ...overrides,
      scheduleMs,
      execute: overrides.execute ?? this.options.execute
    };

    const runScheduled = async () => {
      try {
        await this.runOnce({ execute: this.options.execute, scheduleMs });
      } catch (error) {
        await this.recordError(error);
      }
    };

    this.schedulerTimer = setInterval(runScheduled, scheduleMs);
    await this.store.updateScheduler({
      enabled: true,
      intervalMs: scheduleMs,
      nextRunAt: new Date(Date.now() + scheduleMs).toISOString()
    });

    if (overrides.runImmediately) {
      await runScheduled();
    }

    return this.store.load();
  }

  stopScheduler({ persist = true } = {}) {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    if (!persist) {
      return null;
    }

    return this.store.updateScheduler({
      enabled: false,
      nextRunAt: null
    });
  }

  async recordError(error) {
    const state = await this.store.appendRun({
      id: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: this.options.execute ? 'paper-execution' : 'analysis-only',
      error: {
        message: error.message
      }
    });
    await this.store.updateScheduler({
      lastError: error.message
    });
    return state;
  }
}

module.exports = {
  TradingRuntime
};
