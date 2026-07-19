# Trading AI Agent

A dependency-free Node.js trading agent that analyzes market snapshots and places simulated orders through an in-memory paper broker.

> This is not financial advice. The bundled broker is paper-only and does not connect to a live exchange.

## Run it

All commands are run from this `trading-agent/` directory.

```bash
npm start                                                   # demo analysis
node src/index.js --market-data examples/market-snapshot.json           # analyze example data
node src/index.js --market-data examples/market-snapshot.json --execute # execute against the paper broker
```

## Develop

```bash
npm test
```

See [`docs/trading-agent.md`](./docs/trading-agent.md) for the full feature overview, market-snapshot format, and configuration flags.
