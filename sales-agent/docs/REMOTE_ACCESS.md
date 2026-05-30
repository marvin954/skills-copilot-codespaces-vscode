# Remote access (Cloud / Cursor VM)

`localhost` in your browser is **your computer**, not the cloud VM where the app runs.

## Option 1: Cursor / VS Code port forwarding (recommended)

1. Open the **Ports** panel (Terminal → Ports, or `View` → `Ports`).
2. Forward port **3000** (and optionally **4000**).
3. Open the forwarded URL Cursor shows (e.g. `https://3000-...`).

The repo includes `.vscode/settings.json` to auto-forward port 3000.

## Option 2: Public preview tunnel

If port forwarding is unavailable, start a tunnel:

```bash
npx localtunnel --port 3000
```

Use the printed `https://....loca.lt` URL. You may need to click through a reminder page or enter the tunnel password shown in the terminal.

## Option 3: Run on your machine

```bash
cd sales-agent
docker compose up -d   # requires Docker
npm install
npm run db:push && npm run db:seed
npm run dev:api
npm run dev:web
```

Then `http://localhost:3000` works locally.

## API proxy (single port)

The Next.js app proxies `/api-backend/*` → Express on port 4000. You only need to forward **3000** for the dashboard and API calls from the browser.
