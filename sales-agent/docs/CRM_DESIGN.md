# CRM design

## Objects

| Object | Purpose |
|--------|---------|
| Lead | Top-of-funnel company record |
| Contact | People at the company |
| Deal | Revenue opportunity |
| Conversation | Thread per channel |
| Meeting | Scheduled discovery/demo |
| Campaign | Outbound sequence definition |

## Dashboard views

1. **Command center** — KPI cards (30-day window)
2. **Leads** — sortable by score, filter by status
3. **Deals** — kanban by stage (future)
4. **Activity** — outreach timeline per lead (future)

## Metrics formulas

- **Conversion rate** = deals closed / leads generated  
- **Reply rate** = replies / emails sent  
- **Avg lead score** = mean of `lead.score`  

## Deal stages

```
PROPOSAL → NEGOTIATION → CHECKOUT → PAYMENT_PENDING → WON | LOST
```

Stripe webhook moves `PAYMENT_PENDING` → `WON` and triggers onboarding.

## Playbook-driven fields

Leads inherit `playbookId` for:
- Pricing presented in conversations
- Objection responses
- Max discount % in negotiations
