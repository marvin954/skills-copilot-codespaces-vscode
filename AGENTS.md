# AGENTS.md

## Cursor Cloud specific instructions

This repo is a dependency-free Node.js CLI (`trading-ai-agent`). It requires Node.js only (Node 22 is available); there are no third-party npm packages, so `npm install` is effectively a no-op that just resolves the empty lockfile.

- Run: `npm start` (equivalent to `node src/index.js --demo`). See `README.md` and `docs/trading-agent.md` for all CLI flags (`--market-data`, `--execute`, `--position`, etc.). The CLI is paper-trading only; there is no live broker, network service, or database to start.
- Test: `npm test` (runs `node --test` against `test/`).
- Lint: none configured (no ESLint/Prettier). Do not assume a lint command exists.
- Note: the top-level `README.md` is a GitHub Skills course template and is unrelated to this project. The real project docs are `docs/trading-agent.md`.
