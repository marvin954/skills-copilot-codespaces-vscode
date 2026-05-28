'use strict';

const DEFAULT_CONFIG = Object.freeze({
  mode: 'paper',
  strategy: {
    shortWindow: 5,
    longWindow: 20,
    rsiPeriod: 14,
    momentumLookback: 5,
    minConfidence: 0.35,
    weights: {
      trend: 0.35,
      momentum: 0.25,
      rsi: 0.2,
      aiSignal: 0.15,
      sentiment: 0.05
    }
  },
  risk: {
    maxPositionPercent: 0.2,
    maxOrderNotional: 2500,
    stopLossPercent: 0.08,
    takeProfitPercent: 0.18,
    minCashReservePercent: 0.05,
    quantityPrecision: 4
  }
});

class TradingAgent {
  constructor({ broker, config } = {}) {
    this.broker = broker;
    this.config = mergeConfig(DEFAULT_CONFIG, config || {});
  }

  analyze(snapshot, portfolio = emptyPortfolio()) {
    validateSnapshot(snapshot);

    const prices = snapshot.candles.map((candle) => candle.close);
    const latestPrice = prices.at(-1);
    const indicators = calculateIndicators(prices, this.config.strategy);
    const scorecard = buildScorecard(snapshot, indicators, this.config.strategy.weights);
    const riskSignal = evaluateRiskExit(snapshot.symbol, latestPrice, portfolio, this.config.risk);

    if (riskSignal) {
      return {
        symbol: snapshot.symbol,
        action: 'sell',
        confidence: 1,
        latestPrice,
        indicators,
        scorecard,
        order: buildSellOrder(snapshot.symbol, latestPrice, riskSignal.quantity, riskSignal.reason, this.config.risk.quantityPrecision),
        reason: riskSignal.reason
      };
    }

    const action = classifyAction(scorecard.compositeScore, this.config.strategy.minConfidence);
    const order = buildOrderForAction({
      action,
      symbol: snapshot.symbol,
      latestPrice,
      confidence: Math.abs(scorecard.compositeScore),
      portfolio,
      risk: this.config.risk,
      reason: scorecard.summary
    });

    return {
      symbol: snapshot.symbol,
      action,
      confidence: round(Math.abs(scorecard.compositeScore), 4),
      latestPrice,
      indicators,
      scorecard,
      order,
      reason: order ? order.reason : 'Signal confidence is below threshold or risk limits blocked the trade.'
    };
  }

  async run(snapshot, portfolio) {
    const currentPortfolio = portfolio || (this.broker ? await this.broker.getPortfolio() : emptyPortfolio());
    const decision = this.analyze(snapshot, currentPortfolio);

    if (!decision.order) {
      return { decision, execution: null };
    }

    if (this.config.mode !== 'paper') {
      throw new Error('Live execution is not implemented. Set mode to "paper" to use the bundled paper broker.');
    }

    if (!this.broker) {
      return { decision, execution: null };
    }

    const execution = await this.broker.executeOrder(decision.order);
    return { decision, execution };
  }
}

function calculateIndicators(prices, strategy) {
  const shortSma = simpleMovingAverage(prices, strategy.shortWindow);
  const longSma = simpleMovingAverage(prices, strategy.longWindow);
  const rsi = relativeStrengthIndex(prices, strategy.rsiPeriod);
  const momentum = calculateMomentum(prices, strategy.momentumLookback);
  const volatility = calculateVolatility(prices, strategy.longWindow);

  return {
    shortSma,
    longSma,
    rsi,
    momentum,
    volatility
  };
}

function buildScorecard(snapshot, indicators, weights) {
  const trendScore = indicators.longSma === null
    ? 0
    : clamp(((indicators.shortSma - indicators.longSma) / indicators.longSma) * 20, -1, 1);
  const momentumScore = indicators.momentum === null
    ? 0
    : clamp(indicators.momentum * 20, -1, 1);
  const rsiScore = scoreRsi(indicators.rsi);
  const aiSignalScore = scoreAiSignal(snapshot.aiSignal);
  const sentimentScore = clamp(Number(snapshot.sentimentScore || 0), -1, 1);

  const compositeScore = (
    trendScore * weights.trend
    + momentumScore * weights.momentum
    + rsiScore * weights.rsi
    + aiSignalScore * weights.aiSignal
    + sentimentScore * weights.sentiment
  );

  return {
    trendScore: round(trendScore, 4),
    momentumScore: round(momentumScore, 4),
    rsiScore: round(rsiScore, 4),
    aiSignalScore: round(aiSignalScore, 4),
    sentimentScore: round(sentimentScore, 4),
    compositeScore: round(clamp(compositeScore, -1, 1), 4),
    summary: summarizeScore(compositeScore, indicators)
  };
}

function buildOrderForAction({ action, symbol, latestPrice, confidence, portfolio, risk, reason }) {
  if (action === 'hold') {
    return null;
  }

  if (action === 'sell') {
    const position = getPosition(portfolio, symbol);
    if (!position || position.quantity <= 0) {
      return null;
    }

    const quantity = roundQuantity(position.quantity * confidence, risk.quantityPrecision);
    if (quantity <= 0) {
      return null;
    }

    return buildSellOrder(symbol, latestPrice, Math.min(quantity, position.quantity), reason, risk.quantityPrecision);
  }

  const cash = Number(portfolio.cash || 0);
  const equity = calculateEquity(portfolio);
  const position = getPosition(portfolio, symbol);
  const currentNotional = position ? position.quantity * latestPrice : 0;
  const maxPositionNotional = equity * risk.maxPositionPercent;
  const cashReserve = equity * risk.minCashReservePercent;
  const spendableCash = Math.max(0, cash - cashReserve);
  const targetNotional = maxPositionNotional * confidence;
  const orderNotional = Math.min(
    Math.max(0, targetNotional - currentNotional),
    spendableCash,
    risk.maxOrderNotional
  );
  const quantity = roundQuantity(orderNotional / latestPrice, risk.quantityPrecision);

  if (quantity <= 0) {
    return null;
  }

  return {
    symbol,
    side: 'buy',
    type: 'market',
    quantity,
    estimatedPrice: latestPrice,
    maxNotional: round(orderNotional, 2),
    reason
  };
}

function evaluateRiskExit(symbol, latestPrice, portfolio, risk) {
  const position = getPosition(portfolio, symbol);
  if (!position || position.quantity <= 0 || !position.averagePrice) {
    return null;
  }

  const pnlPercent = (latestPrice - position.averagePrice) / position.averagePrice;

  if (pnlPercent <= -risk.stopLossPercent) {
    return {
      reason: `Stop loss triggered at ${round(pnlPercent * 100, 2)}%.`,
      quantity: position.quantity
    };
  }

  if (pnlPercent >= risk.takeProfitPercent) {
    return {
      reason: `Take profit triggered at ${round(pnlPercent * 100, 2)}%.`,
      quantity: position.quantity
    };
  }

  return null;
}

function classifyAction(score, minConfidence) {
  if (score >= minConfidence) {
    return 'buy';
  }

  if (score <= -minConfidence) {
    return 'sell';
  }

  return 'hold';
}

function buildSellOrder(symbol, latestPrice, quantity, reason, quantityPrecision) {
  return {
    symbol,
    side: 'sell',
    type: 'market',
    quantity: roundQuantity(quantity, quantityPrecision),
    estimatedPrice: latestPrice,
    maxNotional: round(quantity * latestPrice, 2),
    reason
  };
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new TypeError('Market snapshot must be an object.');
  }

  if (!snapshot.symbol || typeof snapshot.symbol !== 'string') {
    throw new TypeError('Market snapshot requires a symbol string.');
  }

  if (!Array.isArray(snapshot.candles) || snapshot.candles.length < 2) {
    throw new TypeError('Market snapshot requires at least two candles.');
  }

  snapshot.candles.forEach((candle, index) => {
    if (!Number.isFinite(candle.close) || candle.close <= 0) {
      throw new TypeError(`Candle ${index} requires a positive numeric close price.`);
    }
  });
}

function simpleMovingAverage(values, period) {
  if (values.length < period) {
    return null;
  }

  const window = values.slice(-period);
  return round(sum(window) / period, 4);
}

function relativeStrengthIndex(values, period) {
  if (values.length <= period) {
    return null;
  }

  let gains = 0;
  let losses = 0;

  for (let index = values.length - period; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  if (losses === 0) {
    return 100;
  }

  const rs = gains / losses;
  return round(100 - (100 / (1 + rs)), 4);
}

function calculateMomentum(values, lookback) {
  if (values.length <= lookback) {
    return null;
  }

  const current = values.at(-1);
  const prior = values[values.length - lookback - 1];
  return round((current - prior) / prior, 6);
}

function calculateVolatility(values, period) {
  if (values.length < period) {
    return null;
  }

  const returns = [];
  const window = values.slice(-period);
  for (let index = 1; index < window.length; index += 1) {
    returns.push((window[index] - window[index - 1]) / window[index - 1]);
  }

  const average = sum(returns) / returns.length;
  const variance = sum(returns.map((value) => (value - average) ** 2)) / returns.length;
  return round(Math.sqrt(variance), 6);
}

function scoreRsi(rsi) {
  if (rsi === null) {
    return 0;
  }

  if (rsi < 30) {
    return 0.9;
  }

  if (rsi < 45) {
    return 0.35;
  }

  if (rsi > 70) {
    return -0.9;
  }

  if (rsi > 60) {
    return -0.25;
  }

  return 0;
}

function scoreAiSignal(aiSignal) {
  if (!aiSignal) {
    return 0;
  }

  if (Number.isFinite(aiSignal.score)) {
    return clamp(aiSignal.score, -1, 1);
  }

  const direction = String(aiSignal.direction || '').toLowerCase();
  if (direction === 'bullish') {
    return clamp(Number(aiSignal.confidence || 0.5), 0, 1);
  }

  if (direction === 'bearish') {
    return clamp(-Number(aiSignal.confidence || 0.5), -1, 0);
  }

  return 0;
}

function summarizeScore(score, indicators) {
  const direction = score > 0 ? 'bullish' : score < 0 ? 'bearish' : 'neutral';
  const parts = [`Composite signal is ${direction} (${round(score, 4)}).`];

  if (indicators.shortSma !== null && indicators.longSma !== null) {
    parts.push(`Short SMA ${indicators.shortSma} vs long SMA ${indicators.longSma}.`);
  }

  if (indicators.rsi !== null) {
    parts.push(`RSI ${indicators.rsi}.`);
  }

  return parts.join(' ');
}

function getPosition(portfolio, symbol) {
  const positions = portfolio.positions || {};

  if (Array.isArray(positions)) {
    return positions.find((position) => position.symbol === symbol) || null;
  }

  return positions[symbol] || null;
}

function calculateEquity(portfolio) {
  if (Number.isFinite(portfolio.equity)) {
    return portfolio.equity;
  }

  const cash = Number(portfolio.cash || 0);
  const positions = Array.isArray(portfolio.positions)
    ? portfolio.positions
    : Object.values(portfolio.positions || {});

  return positions.reduce((total, position) => {
    const markPrice = Number(position.markPrice || position.averagePrice || 0);
    return total + (Number(position.quantity || 0) * markPrice);
  }, cash);
}

function emptyPortfolio() {
  return {
    cash: 0,
    equity: 0,
    positions: {}
  };
}

function mergeConfig(base, override) {
  const output = Array.isArray(base) ? [...base] : { ...base };

  Object.entries(override).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key]) {
      output[key] = mergeConfig(base[key], value);
    } else {
      output[key] = value;
    }
  });

  return output;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function round(value, precision = 4) {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function roundQuantity(value, precision) {
  const factor = 10 ** precision;
  return Math.floor(Number(value) * factor) / factor;
}

module.exports = {
  TradingAgent,
  DEFAULT_CONFIG,
  calculateIndicators,
  buildScorecard,
  classifyAction
};
