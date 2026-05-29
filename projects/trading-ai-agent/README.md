# Trading AI Agent

Dependency-free Node.js trading demo that analyzes market snapshots and can place simulated orders through an in-memory paper broker.

> This is not financial advice. The bundled broker is paper-only and does not connect to a live exchange.

## Run

```bash
cd projects/trading-ai-agent
npm start
```

## Analyze example data

```bash
cd projects/trading-ai-agent
node src/index.js --market-data examples/market-snapshot.json
```

## Execute a paper trade

```bash
cd projects/trading-ai-agent
node src/index.js --market-data examples/market-snapshot.json --execute
```

## Test

```bash
cd projects/trading-ai-agent
npm test
```

More details are in `docs/trading-agent.md`.
