# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single, dependency-free Node.js CLI: a paper-trading AI agent (`trading-ai-agent`). See `docs/trading-agent.md` and `package.json` for the authoritative commands.

- Services: there is no long-running server, database, or GUI. The only runnable artifact is the CLI at `src/index.js`.
- Requirements: Node.js (the project uses the built-in `node:test` runner and `node:*` core modules only). No third-party packages are declared and there is no lockfile, so `npm install` is effectively a no-op.
- Test: `npm test` (runs `node --test`).
- Run (analysis-only demo): `npm start` (equivalent to `node src/index.js --demo`).
- Run and fill a paper order: `node src/index.js --market-data examples/market-snapshot.json --execute`.
- Lint: no linter is configured in this repo.
- Gotcha: the CLI is analysis-only unless `--execute` is passed; without `--execute` the paper broker portfolio stays unchanged (`execution: null`). Pass `--demo` or `--market-data <file>` or the CLI errors out.
- Config: CLI flags override the `TRADING_AGENT_*` / `MARKET_DATA_FILE` env vars documented in `.env.example` and `docs/trading-agent.md`.
