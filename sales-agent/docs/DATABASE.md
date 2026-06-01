# Database schema

PostgreSQL via Prisma. Schema: `packages/database/prisma/schema.prisma`.

## Core entities

### Organization & Playbook
- **Organization** — tenant, settings JSON
- **Playbook** — product copy, pricing tiers, objection rules, negotiation limits

### CRM
- **Lead** — company, contact info, score, status pipeline, tech stack
- **Contact** — decision makers per lead
- **LeadResearch** — pain, opportunity, sales angle, estimated value
- **Deal** — amount, stage, Stripe IDs
- **Meeting** — scheduled calls
- **Conversation** + **ConversationMessage** — multi-turn memory

### Outreach
- **Campaign** — channel sequences
- **OutreachEvent** — per-message tracking (sent, opened, clicked, replied)

### Operations
- **AgentRun** — agent execution audit
- **ManagerReport** — periodic AI recommendations
- **ComplianceLog** / **OptOut** — regulatory audit trail
- **WebhookEvent** — Stripe, Resend, n8n payloads

## Lead status pipeline

```
NEW → RESEARCHING → SCORED → OUTREACH_QUEUED → CONTACTED → ENGAGED
  → MEETING_BOOKED | NEGOTIATING → WON | LOST | NURTURING | OPTED_OUT
```

## Indexes

- `(organizationId, status)`, `(organizationId, score)` on leads
- `(leadId, channel)` on outreach
- `(status, scheduledFor)` for queue scheduling

## Migrations

```bash
cd sales-agent
npm run db:push
npm run db:seed
```
