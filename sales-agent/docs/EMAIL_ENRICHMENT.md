# Email enrichment (Week 1, days 5–7)

Google Maps leads rarely include email addresses. Enrichment runs automatically after each lead is saved.

## Strategy (in order)

1. **Website scrape** — fetches homepage + `/contact`, `/about` pages and extracts emails  
2. **Apollo.io** — people search by domain for decision-makers with emails  

If the lead already has an email, enrichment is skipped.

## Configuration

```bash
# Optional — Apollo people/org search (https://app.apollo.io)
APOLLO_API_KEY=your_apollo_key
APOLLO_RATE_LIMIT_MS=300

# Website scraping (default on)
EMAIL_SCRAPE_ENABLED=true
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/enrichment/status` | Scrape + Apollo availability |
| POST | `/api/enrichment/lead/:leadId` | Enrich one lead |
| POST | `/api/enrichment/batch` | `{ "leadIds": [...] }` or `{ "allWithoutEmail": true, "limit": 25 }` |

## Automatic flow

When **Find & run pipeline** runs:

1. Lead Finder (Google Maps)  
2. **Email enrichment** (scrape → Apollo)  
3. Research → Score → Email outreach  

Discover response includes `emailsEnriched` count.

## Dashboard

- Status line: `Email enrichment: scrape on · Apollo connected`  
- **Enrich missing emails** — batch enrich leads with no email  

## Data stored

On `lead.metadata.emailEnrichment`:

```json
{
  "source": "website_scrape",
  "confidence": "high",
  "at": "2026-05-30T12:00:00.000Z",
  "pagesFetched": ["/", "/contact"],
  "candidatesFound": 3
}
```

Primary `Contact` row is created or updated with the found email.

## Apollo setup

1. Sign up at [apollo.io](https://www.apollo.io/)  
2. Settings → API → Create key  
3. Add to `.env` as `APOLLO_API_KEY`  

Uses:

- `POST /api/v1/mixed_people/search` — decision-maker by domain  
- `GET /api/v1/organizations/enrich` — org fallback email  

## Website scrape notes

- Respects `EMAIL_SCRAPE_ENABLED=false` to disable  
- 8s timeout per page, max 4 paths  
- Filters `noreply@`, `example.com`, image false-positives  
- Prefers emails matching the business domain  

## Testing

```bash
cd sales-agent
npm run test --workspace=@sales-agent/api
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 0 emails enriched | Many SMB sites hide emails behind forms — add Apollo key |
| Apollo 403 | Check API plan includes People Search |
| Scrape timeout | Site may block bots; try Apollo only |
| `info@` only | Low confidence but usable for cold email tests |

## Next (Week 2)

- Verify emails (NeverBounce / ZeroBounce)  
- Hunter.io as alternate provider  
- LinkedIn URL on Contact from Apollo  
