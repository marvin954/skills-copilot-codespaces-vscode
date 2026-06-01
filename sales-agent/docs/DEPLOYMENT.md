# Deployment guide

## Prerequisites

- Node.js 20+
- Docker (PostgreSQL + Redis)
- API keys: at least one LLM; Resend + Stripe for production outreach

## Local development

```bash
cd sales-agent
cp .env.example .env
docker compose up -d
npm install
npm run db:push
npm run db:seed
npm run dev:api      # :4000
npm run worker       # background jobs
npm run dev:web      # :3000
```

## Production (recommended)

### 1. Database
- Managed PostgreSQL (RDS, Supabase, Neon)
- Run `npm run db:migrate` in CI/CD

### 2. Redis
- ElastiCache or Upstash for BullMQ workers

### 3. API
- Deploy `apps/api` to Railway, Fly.io, or ECS
- Set all env vars from `.env.example`
- Run worker as separate process/service

### 4. Web
- Vercel or Netlify for `apps/web`
- `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`

### 5. Webhooks
Register in Stripe/Resend dashboards:
- `https://api.yourdomain.com/webhooks/stripe`
- `https://api.yourdomain.com/webhooks/resend`

### 6. Compliance
- Configure `COMPANY_NAME`, `COMPANY_ADDRESS`, `UNSUBSCRIBE_BASE_URL`
- Set conservative `MAX_*_PER_DAY` limits initially
- Enable quiet hours for SMS/voice

## Docker (optional full stack)

Extend `docker-compose.yml` with `api` and `web` services building from `apps/*`.

## Secrets

Never commit `.env`. Use platform secret managers (Vercel, AWS SSM, Doppler).
