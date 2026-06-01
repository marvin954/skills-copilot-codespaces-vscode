# MVP roadmap

## Phase 1 — Foundation (current)
- [x] Monorepo in `sales-agent/`
- [x] Prisma schema + seed playbooks
- [x] Lead finder (adapter pattern + mock data)
- [x] Research, scoring, email agents
- [x] Conversation + objection handling
- [x] Stripe closing + onboarding flow
- [x] Compliance checks + opt-out
- [x] Dashboard (metrics, leads, deals)
- [x] BullMQ workflow worker

## Phase 2 — Live channels (2–4 weeks engineering)
- [ ] Google Places API integration
- [ ] Apollo / Clearbit enrichment
- [ ] Resend open/click tracking in UI
- [ ] Twilio SMS agent
- [ ] LinkedIn automation (official API or Phantombuster adapter)
- [ ] Vapi voice agent with call scripts

## Phase 3 — Conversion (4–6 weeks)
- [ ] Cal.com / Calendly meeting booking
- [ ] DocuSign contract flow
- [ ] A/B test email variants (Manager agent drives winners)
- [ ] Human handoff queue in dashboard

## Phase 4 — Scale
- [ ] Multi-tenant auth (Clerk/Auth0)
- [ ] Per-org rate limits and billing
- [ ] Horizontal worker scaling
- [ ] Review + upsell automation

## MVP success metrics
- 50+ qualified leads/week
- 5%+ email reply rate
- 2+ meetings booked/week
- 1 closed deal/month at $2.5k+ ACV
