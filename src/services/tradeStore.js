'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_STATE_FILE = '.trading-agent/state.json';

class JsonTradeStore {
  constructor(filePath = process.env.TRADING_AGENT_STATE_FILE || DEFAULT_STATE_FILE) {
    this.filePath = path.resolve(filePath);
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return createInitialState();
      }

      throw error;
    }
  }

  async save(state) {
    const normalized = normalizeState(state);
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
    return normalized;
  }

  async appendRun(run) {
    const state = await this.load();
    const normalizedRun = normalizeRun(run);

    state.runs.unshift(normalizedRun);
    state.runs = state.runs.slice(0, 500);

    if (normalizedRun.execution) {
      state.trades.unshift(normalizedRun.execution);
      state.trades = state.trades.slice(0, 1000);
    }

    if (normalizedRun.portfolio) {
      state.portfolio = normalizedRun.portfolio;
    }

    state.updatedAt = new Date().toISOString();
    return this.save(state);
  }

  async updateScheduler(scheduler) {
    const state = await this.load();
    state.scheduler = {
      ...state.scheduler,
      ...scheduler,
      updatedAt: new Date().toISOString()
    };
    state.updatedAt = new Date().toISOString();
    return this.save(state);
  }

  async reset() {
    return this.save(createInitialState());
  }
}

function createInitialState() {
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    portfolio: {
      cash: Number(process.env.TRADING_AGENT_STARTING_CASH || 10000),
      equity: Number(process.env.TRADING_AGENT_STARTING_CASH || 10000),
      positions: {}
    },
    trades: [],
    runs: [],
    scheduler: {
      enabled: false,
      intervalMs: Number(process.env.TRADING_AGENT_SCHEDULE_MS || 60000),
      lastRunAt: null,
      nextRunAt: null,
      updatedAt: now
    }
  };
}

function normalizeState(state) {
  const initial = createInitialState();
  const normalized = {
    ...initial,
    ...state,
    portfolio: {
      ...initial.portfolio,
      ...(state && state.portfolio ? state.portfolio : {})
    },
    scheduler: {
      ...initial.scheduler,
      ...(state && state.scheduler ? state.scheduler : {})
    },
    trades: Array.isArray(state && state.trades) ? state.trades : [],
    runs: Array.isArray(state && state.runs) ? state.runs : []
  };

  normalized.portfolio.cash = Number(normalized.portfolio.cash || 0);
  normalized.portfolio.equity = Number(normalized.portfolio.equity || normalized.portfolio.cash);
  normalized.portfolio.positions = normalized.portfolio.positions || {};
  normalized.scheduler.intervalMs = Number(normalized.scheduler.intervalMs || 60000);

  return normalized;
}

function normalizeRun(run) {
  const now = new Date().toISOString();
  return {
    id: run.id || `run-${Date.now()}`,
    timestamp: run.timestamp || now,
    mode: run.mode || 'analysis-only',
    snapshot: run.snapshot || null,
    decision: run.decision || null,
    execution: run.execution || null,
    portfolio: run.portfolio || null,
    error: run.error || null
  };
}

module.exports = {
  JsonTradeStore,
  DEFAULT_STATE_FILE,
  createInitialState,
  normalizeState
};
