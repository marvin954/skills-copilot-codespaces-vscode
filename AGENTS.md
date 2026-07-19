# AGENTS.md

## Cursor Cloud specific instructions

This repository holds two independent agent projects, each self-contained in its own directory. Treat them as separate codebases — do not add cross-dependencies between them.

### `trading-agent/`

Dependency-free Node.js CLI (Node 22 available). No third-party npm packages, so `npm install` is effectively a no-op.

- Run: `cd trading-agent && npm start` (see `trading-agent/README.md` and `trading-agent/docs/trading-agent.md` for all flags). Paper-trading only; no network service or database.
- Test: `cd trading-agent && npm test` (`node --test`).
- Lint: none configured.

### `sales-agent/`

Self-contained TypeScript monorepo (Express API, Next.js dashboard, workers, Prisma/Postgres, Redis). It has its own `package.json`, `.env.example`, and `docker-compose.yml`.

- Setup/run/test commands and required services live in `sales-agent/README.md` and `sales-agent/docs/`. Run all its commands from inside `sales-agent/`.
- It requires external services (Postgres/Redis) and API keys; consult its docs before running.

Note: the repo root has no `package.json`; run project commands from within the respective project directory.
