# Folder structure

```
sales-agent/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── agents/          # LeadFinder, Research, Scoring, Email, etc.
│   │       ├── prompts/         # LLM prompt templates
│   │       ├── routes/            # Express REST endpoints
│   │       ├── services/          # LLM, compliance
│   │       ├── workflows/       # Orchestrator + pipeline
│   │       ├── workers/           # BullMQ consumers
│   │       └── index.ts
│   └── web/
│       └── src/app/             # Next.js dashboard pages
├── packages/
│   ├── database/
│   │   └── prisma/schema.prisma
│   └── shared/
│       └── src/                 # Types, scoring, constants
├── docs/                        # Architecture, API, roadmaps
├── docker-compose.yml
├── package.json                 # npm workspaces root
└── README.md
```

Repo root (separate projects):

```
/
├── sales-agent/     ← this project
├── src/             ← trading AI agent (unchanged)
└── docs/
```
