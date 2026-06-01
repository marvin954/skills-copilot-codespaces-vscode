#!/usr/bin/env bash
# Local development environment setup for sales-agent
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Sales Agent — environment setup"
echo "    Root: $ROOT"

# ─── 1. Node dependencies ───────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js 20+ required. Install from https://nodejs.org/"
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "ERROR: Node 20+ required (found $(node -v))"
  exit 1
fi

echo "==> Installing npm dependencies..."
npm install

# ─── 2. Environment file ───────────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Created .env from .env.example — add API keys before live agents"
else
  echo "==> .env already exists (not overwritten)"
fi

# Ensure Next.js can reach API on the VM
grep -q '^INTERNAL_API_URL=' .env 2>/dev/null || \
  echo 'INTERNAL_API_URL=http://127.0.0.1:4000' >> .env

export $(grep -v '^#' .env | grep -v ' ' | xargs -0 2>/dev/null || true)
export DATABASE_URL="${DATABASE_URL:-postgresql://sales_agent:sales_agent_dev@localhost:5432/sales_agent}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

# ─── 3. PostgreSQL ───────────────────────────────────────────────────────────
ensure_postgres() {
  if command -v docker >/dev/null 2>&1 && docker compose ps postgres 2>/dev/null | grep -q running; then
    echo "==> Using Docker Postgres (docker compose)"
    return 0
  fi

  if command -v pg_isready >/dev/null 2>&1; then
    if ! pg_isready -h localhost -q 2>/dev/null; then
      echo "==> Starting PostgreSQL (system service)..."
      sudo service postgresql start 2>/dev/null || sudo systemctl start postgresql 2>/dev/null || true
    fi
    if pg_isready -h localhost -q 2>/dev/null; then
      sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='sales_agent'" 2>/dev/null | grep -q 1 || \
        sudo -u postgres psql -c "CREATE USER sales_agent WITH PASSWORD 'sales_agent_dev' CREATEDB;" 2>/dev/null || true
      sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='sales_agent'" 2>/dev/null | grep -q 1 || \
        sudo -u postgres psql -c "CREATE DATABASE sales_agent OWNER sales_agent;" 2>/dev/null || true
      return 0
    fi
  fi

  if command -v docker >/dev/null 2>&1; then
    echo "==> Starting Postgres + Redis via docker compose..."
    docker compose up -d postgres redis
    sleep 3
    return 0
  fi

  echo "WARN: PostgreSQL not detected. Install Postgres or run: docker compose up -d"
  return 1
}

ensure_postgres || true

# ─── 4. Redis ────────────────────────────────────────────────────────────────
if command -v redis-cli >/dev/null 2>&1; then
  redis-cli ping >/dev/null 2>&1 || {
    sudo service redis-server start 2>/dev/null || true
  }
  echo "==> Redis: $(redis-cli ping 2>/dev/null || echo 'not running — optional for sync discover')"
fi

# ─── 5. Database schema + seed ─────────────────────────────────────────────
echo "==> Prisma generate + push schema..."
DATABASE_URL="$DATABASE_URL" npm run db:generate
DATABASE_URL="$DATABASE_URL" npm run db:push
DATABASE_URL="$DATABASE_URL" npm run db:seed

# ─── 6. Tests ────────────────────────────────────────────────────────────────
echo "==> Running API tests..."
npm run test --workspace=@sales-agent/api || echo "WARN: some tests failed"

echo ""
echo "✅ Setup complete"
echo ""
echo "Next steps:"
echo "  1. Edit .env — add GOOGLE_MAPS_API_KEY, APOLLO_API_KEY, OPENAI_API_KEY or ANTHROPIC_API_KEY"
echo "  2. Terminal 1: npm run dev:api     → http://localhost:4000"
echo "  3. Terminal 2: npm run worker      → background jobs (optional for async)"
echo "   4. Terminal 3: npm run dev:web     → http://localhost:3000"
echo ""
echo "Remote VM? Forward port 3000 in Cursor Ports, or see docs/REMOTE_ACCESS.md"
echo "Docs: docs/GOOGLE_MAPS_SETUP.md, docs/EMAIL_ENRICHMENT.md"
