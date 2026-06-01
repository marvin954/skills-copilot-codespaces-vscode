# Agent workflows

## Autonomous pipeline

```
Lead Found
    ↓
Research Lead (LeadResearchAgent)
    ↓
Score Lead (LeadScoringAgent) — threshold ≥60 for outreach
    ↓
Generate Personalized Pitch (LLM in research + email prompts)
    ↓
Send Outreach (EmailAgent / SMS / LinkedIn / Voice)
    ↓
Handle Responses (ConversationAgent + objection templates)
    ↓
Book Meeting OR Close Directly (ClosingAgent)
    ↓
Collect Payment (Stripe webhook)
    ↓
Onboard Customer (OnboardingAgent)
    ↓
Request Reviews / Upsell (future hooks)
```

## Queue jobs

Enqueue via `POST /api/workflow/enqueue`:

```json
{ "type": "full_pipeline", "organizationId": "...", "leadId": "..." }
```

Worker: `npm run worker` processes `sales-workflow` queue.

## Adding a playbook

1. `POST /api/playbooks` with `slug`, `productSummary`, `pricingTiers`
2. Assign `playbookId` on leads/campaigns
3. Conversation agent uses playbook for pricing and negotiation limits

## Objection handling

Keyword detection → canned ethical responses (`OBJECTION_RESPONSES`)  
Fallback → LLM with playbook context and negotiation caps

## Manager cycle

Run weekly: `POST /api/workflow/manager-report`  
Outputs channel optimizations (email vs LinkedIn vs voice allocation).
