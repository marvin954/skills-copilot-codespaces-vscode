# API reference

Base URL: `http://localhost:4000`

## Health

`GET /health`

## Leads

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leads` | List leads (score desc) |
| GET | `/api/leads/:id` | Lead detail + research, conversations |
| POST | `/api/leads/discover` | Discover + enqueue pipeline |
| POST | `/api/leads/:id/pipeline` | Run research → score → email |

**Discover body:**
```json
{
  "source": "GOOGLE_MAPS",
  "query": "dental offices Austin TX"
}
```

## Deals

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/deals` | Pipeline deals |
| POST | `/api/deals/checkout` | Create Stripe checkout |

## Dashboard

`GET /api/dashboard/metrics` — 30-day KPIs

## Workflow

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/workflow/enqueue` | Queue background job |
| POST | `/api/workflow/manager-report` | Generate manager report |

## Playbooks

`GET /api/playbooks` — Active playbooks  
`POST /api/playbooks` — Create playbook

## Compliance

`POST /api/opt-out` — `{ "email", "phone", "channel", "reason" }`

## Webhooks

- `POST /webhooks/stripe` — Payment completed → onboarding
- `POST /webhooks/resend` — Email opens
- `POST /webhooks/n8n` — Automation events
