# Scaling roadmap

## Technical scaling

| Stage | Leads/day | Architecture |
|-------|-----------|--------------|
| MVP | 50–200 | Single API + 2 workers |
| Growth | 500–2k | Separate worker fleet, read replicas |
| Scale | 5k+ | Sharded queues by org, dedicated enrichment service |

### Queue partitioning
- `sales-workflow-{orgId}` per tenant at scale
- Priority queues: hot leads (score ≥80) first

### LLM cost control
- Cache research results 7 days per domain
- Smaller model for scoring explanations
- Batch research jobs off-peak

### Data retention
- Archive `OutreachEvent` >90 days to cold storage
- Aggregate metrics in `ManagerReport` tables

## Team scaling

| Revenue | Team |
|---------|------|
| <$20k MRR | 1 founder + AI agents |
| $20–100k | 1 AE for enterprise deals, AI for SMB |
| $100k+ | SDR pod + AI for top-of-funnel only |

## Geographic expansion
- Timezone-aware quiet hours per lead location
- Localized playbooks (UK, AU, CA)

## Reliability
- Dead letter queue for failed agent runs
- Idempotent webhooks (Stripe event IDs)
- Circuit breaker on external APIs
