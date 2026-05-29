'use strict';

const http = require('node:http');
const { URL } = require('node:url');
const { findAvailability } = require('./services/availability');

function createCableFinderServer({ catalog } = {}) {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://localhost');

    if (request.method === 'GET' && requestUrl.pathname === '/') {
      sendHtml(response, renderHome());
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/availability') {
      handleAvailabilityRequest(requestUrl, response, catalog);
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  });
}

function handleAvailabilityRequest(requestUrl, response, catalog) {
  try {
    const address = requestUrl.searchParams.get('address');
    const result = findAvailability(address, catalog);
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

function renderHome() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cable Finder</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --brand: #1246ff;
      --ink: #152033;
      --muted: #667085;
      --surface: #ffffff;
      --line: #d9e0ee;
      --page: #f3f6fb;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: linear-gradient(135deg, #edf3ff, #ffffff 42%, #eef8f3);
      color: var(--ink);
      min-height: 100vh;
    }

    main {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 56px 0;
    }

    .hero {
      display: grid;
      gap: 28px;
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
      align-items: center;
    }

    .eyebrow {
      color: var(--brand);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 0.78rem;
    }

    h1 {
      font-size: clamp(2.25rem, 6vw, 4.75rem);
      line-height: 0.95;
      margin: 12px 0 20px;
      max-width: 780px;
    }

    .lede {
      color: var(--muted);
      font-size: 1.16rem;
      line-height: 1.65;
      max-width: 680px;
    }

    .finder-card,
    .result-card {
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid var(--line);
      border-radius: 28px;
      box-shadow: 0 24px 80px rgba(43, 70, 130, 0.14);
      padding: 28px;
    }

    form {
      display: grid;
      gap: 14px;
    }

    label {
      font-weight: 700;
    }

    input {
      width: 100%;
      padding: 16px 18px;
      border: 1px solid var(--line);
      border-radius: 16px;
      font: inherit;
      color: var(--ink);
      outline: none;
    }

    input:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 4px rgba(18, 70, 255, 0.1);
    }

    button {
      border: 0;
      border-radius: 16px;
      background: var(--brand);
      color: #fff;
      cursor: pointer;
      font: inherit;
      font-weight: 800;
      padding: 16px 18px;
    }

    button:disabled {
      cursor: progress;
      opacity: 0.72;
    }

    .hint {
      color: var(--muted);
      font-size: 0.92rem;
      margin: 0;
    }

    .results {
      margin-top: 34px;
      display: grid;
      gap: 18px;
    }

    .result-card {
      padding: 24px;
    }

    .summary {
      font-weight: 800;
      font-size: 1.15rem;
      margin: 0 0 12px;
    }

    .service-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }

    .service {
      border: 1px solid var(--line);
      border-radius: 22px;
      padding: 18px;
      background: var(--surface);
    }

    .service h3 {
      margin: 8px 0 6px;
    }

    .badge {
      display: inline-flex;
      border-radius: 999px;
      background: #e8efff;
      color: #1239b5;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 6px 10px;
    }

    .tiers {
      list-style: none;
      margin: 14px 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }

    .tiers li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid #edf1f8;
      padding-top: 8px;
    }

    .matches {
      color: var(--muted);
      font-size: 0.9rem;
      margin: 10px 0 0;
    }

    .empty,
    .error {
      border-radius: 18px;
      padding: 18px;
      background: #fff5eb;
      border: 1px solid #ffd7a8;
    }

    .error {
      background: #fff1f3;
      border-color: #ffc7d0;
    }

    @media (max-width: 860px) {
      .hero {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div>
        <p class="eyebrow">Telecom service lookup</p>
        <h1>Find every internet option at a customer address.</h1>
        <p class="lede">Enter a street address and Cable Finder checks the local service catalog for fiber, cable, fixed wireless, DSL, and business internet availability.</p>
      </div>

      <div class="finder-card">
        <form id="finder-form">
          <label for="address">Customer address</label>
          <input id="address" name="address" autocomplete="street-address" placeholder="123 Main St, Springfield, IL 62704" required>
          <button type="submit">Check availability</button>
          <p class="hint">Try: 1200 Main St, Springfield, IL 62704 or 88 Commerce Plaza Suite 400, Springfield, IL 62701.</p>
        </form>
      </div>
    </section>

    <section id="results" class="results" aria-live="polite"></section>
  </main>

  <script>
    const form = document.querySelector('#finder-form');
    const results = document.querySelector('#results');
    const button = form.querySelector('button');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const address = new FormData(form).get('address');
      button.disabled = true;
      results.innerHTML = '<div class="result-card">Checking availability...</div>';

      try {
        const response = await fetch('/api/availability?address=' + encodeURIComponent(address));
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to check availability.');
        }

        results.innerHTML = renderResults(payload);
      } catch (error) {
        results.innerHTML = '<div class="error">' + escapeHtml(error.message) + '</div>';
      } finally {
        button.disabled = false;
      }
    });

    function renderResults(payload) {
      if (payload.services.length === 0) {
        return '<div class="empty">' + escapeHtml(payload.summary) + '</div>';
      }

      return '<div class="result-card"><p class="summary">' + escapeHtml(payload.summary) + '</p><div class="service-grid">'
        + payload.services.map(renderService).join('')
        + '</div></div>';
    }

    function renderService(service) {
      return '<article class="service">'
        + '<span class="badge">' + escapeHtml(service.technology) + '</span>'
        + '<h3>' + escapeHtml(service.provider + ' - ' + service.name) + '</h3>'
        + '<p>' + escapeHtml(service.installation) + '</p>'
        + '<ul class="tiers">' + service.tiers.map((tier) => (
          '<li><strong>' + escapeHtml(tier.name) + '</strong><span>' + tier.downloadMbps + '/' + tier.uploadMbps + ' Mbps - $' + tier.monthlyPrice + '/mo</span></li>'
        )).join('') + '</ul>'
        + '<p class="matches">Matched by ' + escapeHtml(service.matchReasons.join(', ')) + '.</p>'
        + '</article>';
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[character]));
    }
  </script>
</body>
</html>`;
}

function sendHtml(response, body) {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8'
  });
  response.end(body);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

module.exports = {
  createCableFinderServer,
  renderHome
};
