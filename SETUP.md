# PostgreSQL setup

## Option A: Docker (recommended)

```powershell
docker compose up -d postgres
copy .env.example .env
npm run db:setup
npm run dev
```

## Option B: Local PostgreSQL on Windows

1. Install PostgreSQL 16+:
   ```powershell
   winget install PostgreSQL.PostgreSQL.17
   ```
2. Use the password you chose during install in `.env` (`DB_PASSWORD`).
3. Copy env and run setup:
   ```powershell
   copy .env.example .env
   npm run db:setup
   npm run dev
   ```

When setup succeeds, the API logs `Connected to PostgreSQL` instead of the in-memory fallback.

## Verify

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod -Method POST -Uri http://localhost:5000/api/search -ContentType "application/json" -Body '{"city":"Austin","state":"TX"}'
```
