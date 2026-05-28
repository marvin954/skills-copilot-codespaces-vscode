'use strict';

class PaperBroker {
  constructor({ startingCash = 10000, positions = {} } = {}) {
    this.cash = Number(startingCash);
    this.positions = normalizePositions(positions);
    this.orders = [];
  }

  async getPortfolio() {
    return {
      cash: round(this.cash, 2),
      equity: round(this.calculateEquity(), 2),
      positions: clone(this.positions)
    };
  }

  async executeOrder(order) {
    validateOrder(order);

    const fillPrice = Number(order.estimatedPrice);
    const notional = round(order.quantity * fillPrice, 2);
    const timestamp = new Date().toISOString();

    if (order.side === 'buy') {
      if (notional > this.cash) {
        throw new Error(`Paper broker rejected buy: ${notional} exceeds available cash ${this.cash}.`);
      }

      this.cash = round(this.cash - notional, 2);
      this.addPosition(order.symbol, order.quantity, fillPrice);
    } else {
      this.removePosition(order.symbol, order.quantity, fillPrice);
      this.cash = round(this.cash + notional, 2);
    }

    const execution = {
      id: `paper-${this.orders.length + 1}`,
      status: 'filled',
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      fillPrice,
      notional,
      timestamp,
      reason: order.reason
    };

    this.orders.push(execution);
    return execution;
  }

  addPosition(symbol, quantity, price) {
    const current = this.positions[symbol];

    if (!current) {
      this.positions[symbol] = {
        symbol,
        quantity,
        averagePrice: price,
        markPrice: price
      };
      return;
    }

    const currentNotional = current.quantity * current.averagePrice;
    const addedNotional = quantity * price;
    const newQuantity = current.quantity + quantity;

    current.quantity = roundQuantity(newQuantity, 4);
    current.averagePrice = round((currentNotional + addedNotional) / newQuantity, 4);
    current.markPrice = price;
  }

  removePosition(symbol, quantity, price) {
    const current = this.positions[symbol];
    if (!current || current.quantity < quantity) {
      throw new Error(`Paper broker rejected sell: insufficient ${symbol} position.`);
    }

    current.quantity = roundQuantity(current.quantity - quantity, 4);
    current.markPrice = price;

    if (current.quantity <= 0) {
      delete this.positions[symbol];
    }
  }

  calculateEquity() {
    return Object.values(this.positions).reduce((total, position) => {
      const markPrice = Number(position.markPrice || position.averagePrice);
      return total + (position.quantity * markPrice);
    }, this.cash);
  }
}

function validateOrder(order) {
  if (!order || typeof order !== 'object') {
    throw new TypeError('Order must be an object.');
  }

  if (!order.symbol || typeof order.symbol !== 'string') {
    throw new TypeError('Order requires a symbol string.');
  }

  if (!['buy', 'sell'].includes(order.side)) {
    throw new TypeError('Order side must be "buy" or "sell".');
  }

  if (!Number.isFinite(order.quantity) || order.quantity <= 0) {
    throw new TypeError('Order quantity must be positive.');
  }

  if (!Number.isFinite(order.estimatedPrice) || order.estimatedPrice <= 0) {
    throw new TypeError('Order estimatedPrice must be positive.');
  }
}

function normalizePositions(positions) {
  if (Array.isArray(positions)) {
    return positions.reduce((accumulator, position) => {
      accumulator[position.symbol] = { ...position };
      return accumulator;
    }, {});
  }

  return clone(positions);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function round(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function roundQuantity(value, precision) {
  const factor = 10 ** precision;
  return Math.floor(Number(value) * factor) / factor;
}

module.exports = {
  PaperBroker
};
