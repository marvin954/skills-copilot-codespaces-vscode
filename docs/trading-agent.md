# Trading AI Agent

This repository includes a dependency-free Node.js trading agent that can analyze market snapshots and place simulated orders through a paper broker.

> This is not financial advice. The bundled broker is paper-only and does not connect to a live exchange.

## What it does

- Scores a symbol with a weighted signal model:
  - short/long simple moving averages
  - price momentum
  - RSI
  - optional `aiSignal`
  - optional sentiment score
- Applies risk controls before creating an order:
  - maximum position allocation per symbol
  - maximum order notional
  - cash reserve
  - stop-loss and take-profit exits
- Runs in analysis-only mode by default.
- Uses an in-memory paper broker when `--execute` is supplied.

## Run it

```bash
npm start
```

Analyze the example market data:

```bash
node src/index.js --market-data examples/market-snapshot.json
```

Execute the suggested trade against the paper broker:

```bash
node src/index.js --market-data examples/market-snapshot.json --execute
```

Seed an existing paper position to test exits:

```bash
node src/index.js --market-data examples/market-snapshot.json --execute --position AAPL:10:240
```

## Market snapshot format

```json
{
  "symbol": "AAPL",
  "sentimentScore": 0.9,
  "aiSignal": {
    "direction": "bullish",
    "confidence": 1,
    "rationale": "Optional model output or human-reviewed signal."
  },
  "candles": [
    {
      "time": "2026-01-01T00:00:00.000Z",
      "open": 181.2,
      "high": 183.1,
      "low": 180.8,
      "close": 182.4,
      "volume": 1120000
    }
  ]
}
```

`aiSignal.score` can be supplied directly as a value from `-1` to `1`. If `score` is absent, the agent converts `direction` and `confidence` into a signed score.

## Configuration

CLI flags override environment variables:

| Flag | Environment variable | Default |
| --- | --- | --- |
| `--cash` | `TRADING_AGENT_STARTING_CASH` | `10000` |
| `--market-data` | `MARKET_DATA_FILE` | none |
| `--max-order-notional` | `TRADING_AGENT_MAX_ORDER_NOTIONAL` | `2500` |
| `--max-position-percent` | `TRADING_AGENT_MAX_POSITION_PERCENT` | `0.2` |
| `--min-confidence` | `TRADING_AGENT_MIN_CONFIDENCE` | `0.35` |
| `--symbol` | `TRADING_AGENT_SYMBOL` | `DEMO` |

## Development

```bash
npm test
```

The implementation lives in:

- `src/agents/tradingAgent.js`
- `src/services/paperBroker.js`
- `src/services/marketData.js`
- `src/index.js`
