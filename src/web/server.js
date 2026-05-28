'use strict';

const http = require('node:http');
const { URL } = require('node:url');

function createDashboardServer(runtime) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

      if (request.method === 'GET' && url.pathname === '/') {
        sendHtml(response, renderDashboard());
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/status') {
        sendJson(response, await runtime.getState());
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/history') {
        const state = await runtime.getState();
        sendJson(response, {
          trades: state.trades,
          runs: state.runs,
          portfolio: state.portfolio
        });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/run') {
        const body = await readJson(request);
        sendJson(response, await runtime.runOnce(body));
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/scheduler/start') {
        const body = await readJson(request);
        sendJson(response, await runtime.startScheduler(body));
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/scheduler/stop') {
        sendJson(response, await runtime.stopScheduler());
        return;
      }

      sendJson(response, { error: 'Not found' }, 404);
    } catch (error) {
      sendJson(response, { error: error.message }, 500);
    }
  });
}

function listen(server, { host = '127.0.0.1', port = 3000 } = {}) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve(server);
    });
  });
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        request.destroy(new Error('Request body too large.'));
      }
    });
    request.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, payload, statusCode = 200) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function sendHtml(response, html) {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(html);
}

function renderDashboard() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Trading AI Agent</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f172a;
      color: #e2e8f0;
    }
    body { margin: 0; padding: 32px; }
    main { max-width: 1180px; margin: 0 auto; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    p { color: #94a3b8; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 20px; box-shadow: 0 16px 40px rgb(0 0 0 / 20%); }
    .metric { font-size: 28px; font-weight: 700; margin-top: 8px; }
    button, input, select { border-radius: 10px; border: 1px solid #334155; padding: 10px 12px; background: #020617; color: #e2e8f0; }
    button { cursor: pointer; background: #2563eb; border-color: #2563eb; font-weight: 700; }
    button.secondary { background: #334155; border-color: #334155; }
    button.danger { background: #dc2626; border-color: #dc2626; }
    label { display: grid; gap: 6px; color: #cbd5e1; font-size: 14px; }
    .controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; overflow: hidden; }
    th, td { text-align: left; border-bottom: 1px solid #1f2937; padding: 10px; font-size: 14px; vertical-align: top; }
    th { color: #94a3b8; font-weight: 600; }
    code { color: #bfdbfe; }
    .status { display: inline-flex; align-items: center; gap: 8px; }
    .dot { width: 10px; height: 10px; border-radius: 999px; background: #64748b; }
    .dot.on { background: #22c55e; }
    .error { color: #fca5a5; white-space: pre-wrap; }
  </style>
</head>
<body>
  <main>
    <h1>Trading AI Agent</h1>
    <p>Paper-trading dashboard for persistent trade history, manual runs, and scheduled agent execution.</p>

    <section class="grid">
      <article class="card">
        <h2>Portfolio</h2>
        <div>Equity</div>
        <div class="metric" id="equity">--</div>
        <div>Cash: <span id="cash">--</span></div>
      </article>
      <article class="card">
        <h2>Scheduler</h2>
        <div class="status"><span class="dot" id="scheduler-dot"></span><span id="scheduler-state">--</span></div>
        <p>Next run: <span id="next-run">--</span></p>
      </article>
      <article class="card">
        <h2>Latest decision</h2>
        <div class="metric" id="latest-action">--</div>
        <p id="latest-reason">No runs yet.</p>
      </article>
    </section>

    <section class="card" style="margin-top: 16px;">
      <h2>Manage agent</h2>
      <div class="controls">
        <label>Execution mode
          <select id="execute">
            <option value="true">Paper execute</option>
            <option value="false">Analyze only</option>
          </select>
        </label>
        <label>Schedule interval (ms)
          <input id="schedule-ms" type="number" min="1000" step="1000" value="60000">
        </label>
        <button id="run-now">Run now</button>
        <button id="start-scheduler">Start scheduler</button>
        <button class="danger" id="stop-scheduler">Stop scheduler</button>
        <button class="secondary" id="refresh">Refresh</button>
      </div>
      <p class="error" id="error"></p>
    </section>

    <section class="card" style="margin-top: 16px;">
      <h2>Positions</h2>
      <table>
        <thead><tr><th>Symbol</th><th>Quantity</th><th>Average price</th><th>Mark price</th></tr></thead>
        <tbody id="positions"></tbody>
      </table>
    </section>

    <section class="card" style="margin-top: 16px;">
      <h2>Trade history</h2>
      <table>
        <thead><tr><th>Time</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Fill</th><th>Notional</th><th>Reason</th></tr></thead>
        <tbody id="trades"></tbody>
      </table>
    </section>

    <section class="card" style="margin-top: 16px;">
      <h2>Run history</h2>
      <table>
        <thead><tr><th>Time</th><th>Mode</th><th>Symbol</th><th>Action</th><th>Confidence</th><th>Status</th></tr></thead>
        <tbody id="runs"></tbody>
      </table>
    </section>
  </main>

  <script>
    const formatMoney = (value) => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
    const formatNumber = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });
    const el = (id) => document.getElementById(id);

    async function request(path, options = {}) {
      const response = await fetch(path, {
        headers: { 'content-type': 'application/json' },
        ...options
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Request failed');
      return payload;
    }

    async function load() {
      el('error').textContent = '';
      try {
        const state = await request('/api/status');
        render(state);
      } catch (error) {
        el('error').textContent = error.message;
      }
    }

    function render(state) {
      el('equity').textContent = formatMoney(state.portfolio.equity);
      el('cash').textContent = formatMoney(state.portfolio.cash);
      el('scheduler-state').textContent = state.scheduler.enabled ? 'Running' : 'Stopped';
      el('scheduler-dot').className = state.scheduler.enabled ? 'dot on' : 'dot';
      el('next-run').textContent = state.scheduler.nextRunAt || '--';
      el('schedule-ms').value = state.scheduler.intervalMs || 60000;

      const latest = state.runs[0];
      el('latest-action').textContent = latest && latest.decision ? latest.decision.action.toUpperCase() : '--';
      el('latest-reason').textContent = latest && latest.decision ? latest.decision.reason : 'No runs yet.';

      const positions = Object.values(state.portfolio.positions || {});
      el('positions').innerHTML = positions.length ? positions.map((position) => '<tr><td>' + position.symbol + '</td><td>' + formatNumber(position.quantity) + '</td><td>' + formatMoney(position.averagePrice) + '</td><td>' + formatMoney(position.markPrice || position.averagePrice) + '</td></tr>').join('') : '<tr><td colspan="4">No positions.</td></tr>';

      el('trades').innerHTML = state.trades.length ? state.trades.map((trade) => '<tr><td>' + trade.timestamp + '</td><td>' + trade.symbol + '</td><td>' + trade.side + '</td><td>' + formatNumber(trade.quantity) + '</td><td>' + formatMoney(trade.fillPrice) + '</td><td>' + formatMoney(trade.notional) + '</td><td>' + (trade.reason || '') + '</td></tr>').join('') : '<tr><td colspan="7">No trades yet.</td></tr>';

      el('runs').innerHTML = state.runs.length ? state.runs.map((run) => '<tr><td>' + run.timestamp + '</td><td>' + run.mode + '</td><td>' + ((run.snapshot && run.snapshot.symbol) || '--') + '</td><td>' + ((run.decision && run.decision.action) || '--') + '</td><td>' + ((run.decision && run.decision.confidence) || '--') + '</td><td>' + (run.error ? run.error.message : (run.execution ? run.execution.status : 'no order')) + '</td></tr>').join('') : '<tr><td colspan="6">No runs yet.</td></tr>';
    }

    function body() {
      return JSON.stringify({
        execute: el('execute').value === 'true',
        scheduleMs: Number(el('schedule-ms').value)
      });
    }

    el('run-now').addEventListener('click', async () => {
      try {
        await request('/api/run', { method: 'POST', body: body() });
        await load();
      } catch (error) {
        el('error').textContent = error.message;
      }
    });
    el('start-scheduler').addEventListener('click', async () => {
      try {
        await request('/api/scheduler/start', { method: 'POST', body: body() });
        await load();
      } catch (error) {
        el('error').textContent = error.message;
      }
    });
    el('stop-scheduler').addEventListener('click', async () => {
      try {
        await request('/api/scheduler/stop', { method: 'POST' });
        await load();
      } catch (error) {
        el('error').textContent = error.message;
      }
    });
    el('refresh').addEventListener('click', load);
    setInterval(load, 5000);
    load();
  </script>
</body>
</html>`;
}

module.exports = {
  createDashboardServer,
  listen
};
