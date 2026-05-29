# AGENTS.md

Guidance for AI agents working in this repository.

## Project overview

Single-package Node.js CLI (**trading-ai-agent**): analyzes market snapshots (SMA, momentum, RSI, optional AI/sentiment signals) and optionally executes **paper** trades via an in-memory broker. No runtime dependencies beyond Node.js.

The root `README.md` is still oriented toward the GitHub Copilot skills course template. Application docs live in `docs/trading-agent.md`.

## Cursor Cloud specific instructions

### Services

No separate processes are required. Everything runs in one Node.js process (CLI + in-memory `PaperBroker`). There is no dev server, database, or Docker Compose stack.

### Commands

| Task | Command |
|------|---------|
| Install | `npm install` (no third-party deps; keeps npm metadata in sync) |
| Demo (analysis) | `npm start` → `node src/index.js --demo` |
| Analyze file | `node src/index.js --market-data examples/market-snapshot.json` |
| Paper execution | Add `--execute` to the above |
| Tests | `npm test` (`node --test` under `test/`) |
| Lint | **Not configured** — no ESLint/Prettier scripts in `package.json` |

Optional env overrides: see `.env.example` (`TRADING_AGENT_*`, `MARKET_DATA_FILE`).

### Hello-world verification

After `npm install`, run `npm test`, then:

```bash
node src/index.js --market-data examples/market-snapshot.json --execute
```

Expect `mode: "paper-execution"`, a filled order in `execution`, and updated `portfolio` (cash reduced, `AAPL` position present).

### Node version

Use Node.js LTS with built-in `node --test` (Node 18+). The repo does not pin `engines` or ship `.nvmrc`.
