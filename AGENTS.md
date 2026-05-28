# AGENTS.md

## Cursor Cloud specific instructions

This is a zero-dependency Node.js CLI application (paper-trading AI agent). Node.js >= 18 is required.

### Key commands

| Task | Command |
|------|---------|
| Run (demo mode) | `npm start` or `node src/index.js --demo` |
| Run (market data) | `node src/index.js --market-data examples/market-snapshot.json --execute` |
| Run tests | `npm test` (runs `node --test`) |

- There is **no linter** configured (no ESLint, no Prettier, no TypeScript).
- There are **zero npm dependencies** — `npm install` completes instantly.
- All state is in-memory; no database, Docker, or network access is needed.
- The `--demo` flag generates synthetic market data so no external files are required.
- To test stop-loss/take-profit exits, seed a position: `--position SYMBOL:QTY:AVG_PRICE`.
- See `docs/trading-agent.md` and `README.md` for full CLI flags and market snapshot format.
