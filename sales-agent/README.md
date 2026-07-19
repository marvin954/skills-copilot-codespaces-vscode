# Autonomous SaaS Sales Agent

Production-ready, multi-agent B2B sales system for **AI Automation Services**, **AI Call Centers**, **AI Chatbots**, **Lead Generation Systems**, and **Business Automation Solutions** — optimized for SMB outreach (5–200 employees).

This project lives in its own folder so it stays separate from other agents in the repository (e.g. the trading agent in the [`trading-agent/`](../trading-agent/) folder).

## Quick start

```bash
cd sales-agent
npm run setup      # installs deps, Postgres schema, seed data, runs tests
```

Or manually:

```bash
cd sales-agent
cp .env.example .env
docker compose up -d   # optional if you have Docker
npm install
npm run db:push && npm run db:seed
npm run dev:api    # terminal 1
npm run worker     # terminal 2 (optional)
npm run dev:web    # terminal 3
```

Add API keys to `.env` — see [GOOGLE_MAPS_SETUP](./docs/GOOGLE_MAPS_SETUP.md) and [EMAIL_ENRICHMENT](./docs/EMAIL_ENRICHMENT.md).

- **API:** http://localhost:4000  
- **Dashboard:** http://localhost:3000  

## Folder structure

```
sales-agent/
├── apps/
│   ├── api/          # Express API + agents + workers
│   └── web/          # Next.js CRM dashboard
├── packages/
│   ├── database/     # Prisma schema & client
│   └── shared/       # Types, scoring, constants
├── docs/             # Architecture, API, deployment, roadmaps
├── docker-compose.yml
└── package.json
```

## Capabilities

| Module | Description |
|--------|-------------|
| Lead generation | Google Maps, LinkedIn, websites, directories (adapter pattern) |
| Lead scoring | 0–100 score with weighted breakdown |
| Research agent | Pain points, opportunities, personalized angles |
| Multi-channel outreach | Email (Resend), SMS (Twilio), LinkedIn, Voice (Vapi/Bland/Retell) |
| Conversation AI | Memory, objections, pricing, negotiation limits |
| Closing | Stripe checkout, deal pipeline |
| Onboarding | Post-payment welcome & checklist |
| CRM | Leads, contacts, deals, conversations, metrics |
| Manager agent | Performance reports & optimization |
| Compliance | CAN-SPAM, TCPA, opt-out, rate limits, audit logs |

## Documentation (read before building)

| Doc | Description |
|-----|-------------|
| [**TECHNICAL_ARCHITECTURE.md**](./docs/TECHNICAL_ARCHITECTURE.md) | Complete system design — agents, DB, API, auth, queues, security, costs |
| [**IMPLEMENTATION_PLAN.md**](./docs/IMPLEMENTATION_PLAN.md) | 30 / 60 / 90–120 day execution plan |
| [PRODUCT_BRIEF.md](./docs/PRODUCT_BRIEF.md) | Product scope (separate from Real Estate tool) |

Additional: [DATABASE](./docs/DATABASE.md), [API](./docs/API.md), [DEPLOYMENT](./docs/DEPLOYMENT.md), [MVP_ROADMAP](./docs/MVP_ROADMAP.md).

**This is a separate SaaS product** — not the Real Estate Parcel Research Tool.

## License

MIT
