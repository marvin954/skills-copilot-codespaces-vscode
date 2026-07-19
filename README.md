# Agents monorepo

This repository contains two independent, self-contained agent projects. They share nothing at runtime and can be developed, built, and run separately.

## Projects

| Project | Location | Description |
| --- | --- | --- |
| Trading AI Agent | [`trading-agent/`](./trading-agent/) | Dependency-free Node.js paper-trading CLI with risk controls. |
| Autonomous SaaS Sales Agent | [`sales-agent/`](./sales-agent/) | Multi-agent B2B sales system (Express API, Next.js dashboard, workers, Postgres/Redis). |

Each project has its own `package.json`, dependencies, docs, and setup instructions in its directory. See:

- [`trading-agent/README.md`](./trading-agent/README.md)
- [`sales-agent/README.md`](./sales-agent/README.md)
