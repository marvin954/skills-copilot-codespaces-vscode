# Google Maps / Places API setup (Week 1)

The Lead Finder uses **Google Places API (New)** Text Search plus optional **Geocoding API** for location bias.

## 1. Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable billing (Places API requires it; ~$17 per 1k Text Search requests — check current pricing)

## 2. Enable APIs

Enable these APIs for your project:

| API | Purpose |
|-----|---------|
| **Places API (New)** | Business search (`places:searchText`) |
| **Geocoding API** | Convert "Austin, TX" → lat/lng for better local results |

Console links:

- Places API (New): APIs & Services → Library → "Places API (New)"
- Geocoding API: "Geocoding API"

## 3. Create API key

1. APIs & Services → **Credentials** → **Create credentials** → **API key**
2. Restrict the key (recommended):
   - **Application restrictions:** IP addresses (your server) or none for dev
   - **API restrictions:** Only Places API (New) + Geocoding API
3. Copy the key into `sales-agent/.env`:

```bash
GOOGLE_MAPS_API_KEY=AIza...
```

## 4. Verify

Restart the API, then:

```bash
curl http://localhost:4000/api/control/google-places/status
# { "configured": true, "mockMode": false, ... }

curl -X POST http://localhost:4000/api/control/discover \
  -H 'Content-Type: application/json' \
  -d '{
    "source": "GOOGLE_MAPS",
    "query": "dental offices",
    "location": "Austin, TX",
    "limit": 5,
    "mode": "sync"
  }'
```

Leads should have real business names, addresses, phones, and `metadata.googlePlaceId`.

## 5. Dashboard

On the home page **Agent control** panel:

- Set **Business type** (e.g. `courier companies`)
- Set **Location** (e.g. `Dallas, TX`)
- Click **Find & run pipeline**

Status line shows **live Places API** vs **mock data**.

## 6. Mock mode (development without billing)

```bash
# Omit GOOGLE_MAPS_API_KEY, or force mock:
GOOGLE_PLACES_USE_MOCK=true
```

## 7. Data stored per lead

| Field | Source |
|-------|--------|
| `companyName` | `displayName` |
| `phone` | `nationalPhoneNumber` |
| `website` | `websiteUri` |
| `location` | `formattedAddress` |
| `industry` | `primaryTypeDisplayName` |
| `metadata.googlePlaceId` | Dedup key |
| `metadata.googleMapsUri` | Link to Maps listing |

Email is **not** provided by Places API — add Apollo or website scrape in Week 1 days 5–7.

## 8. Troubleshooting

| Error | Fix |
|-------|-----|
| `API key not valid` | Check key, restrictions, billing |
| `Places API has not been used` / 403 | Enable **Places API (New)** (not legacy Places only) |
| Empty results | Broaden query; add location field |
| Duplicate leads skipped | Expected — same `googlePlaceId` won't insert twice |

## Cost control (solo founder)

- Start with `limit: 5` per search
- Cap daily discovers in n8n or settings
- Monitor: Google Cloud → APIs & Services → Dashboard
