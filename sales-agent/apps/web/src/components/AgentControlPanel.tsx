"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi, postApi } from "@/lib/api";

interface AgentRun {
  id: string;
  agentType: string;
  status: string;
  leadId: string | null;
  error: string | null;
  createdAt: string;
}

interface ControlStatus {
  leadCount: number;
  recentRuns: AgentRun[];
}

interface DiscoverResult {
  ok: boolean;
  saved?: number;
  emailsEnriched?: number;
  leadIds?: string[];
  pipelines?: Array<{ leadId: string; score?: number; error?: string }>;
  message?: string;
}

interface EnrichmentStatus {
  websiteScrape: boolean;
  apollo: boolean;
}

const SOURCES = [
  { value: "GOOGLE_MAPS", label: "Google Maps" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "WEBSITE_SCRAPE", label: "Website scrape" },
  { value: "DIRECTORY", label: "Business directory" },
  { value: "SOCIAL", label: "Social media" },
] as const;

interface GooglePlacesStatus {
  configured: boolean;
  mockMode: boolean;
  hint?: string;
}

export function AgentControlPanel() {
  const [query, setQuery] = useState("dental offices");
  const [location, setLocation] = useState("Austin, TX");
  const [source, setSource] = useState<string>("GOOGLE_MAPS");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [mapsStatus, setMapsStatus] = useState<GooglePlacesStatus | null>(null);
  const [enrichStatus, setEnrichStatus] = useState<EnrichmentStatus | null>(null);

  const appendLog = useCallback((msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await fetchApi<ControlStatus>("/api/control/status");
      setRuns(status.recentRuns);
      setLeadCount(status.leadCount);
    } catch {
      appendLog("Could not refresh agent status (is API running?)");
    }
  }, [appendLog]);

  useEffect(() => {
    refreshStatus();
    fetchApi<GooglePlacesStatus>("/api/control/google-places/status")
      .then(setMapsStatus)
      .catch(() => setMapsStatus(null));
    fetchApi<EnrichmentStatus>("/api/enrichment/status")
      .then(setEnrichStatus)
      .catch(() => setEnrichStatus(null));
    const id = setInterval(refreshStatus, 15000);
    return () => clearInterval(id);
  }, [refreshStatus]);

  async function runDiscover(mode: "sync" | "async") {
    setLoading("discover");
    const fullQuery = location ? `${query} (${location})` : query;
    appendLog(`Discovering leads: "${fullQuery}" via ${source} (${mode})…`);
    try {
      const result = await postApi<DiscoverResult>("/api/control/discover", {
        query,
        location: location || undefined,
        source,
        limit,
        mode,
      });
      if (result.message) {
        appendLog(result.message);
      } else {
        appendLog(
          `Found ${result.saved ?? 0} leads, ${result.emailsEnriched ?? 0} emails enriched. Pipelines: ${
            result.pipelines
              ?.map((p) =>
                p.error
                  ? `✗ ${p.leadId.slice(0, 8)}…`
                  : `✓ score ${p.score ?? "?"}`
              )
              .join(", ") ?? "queued"
          }`
        );
      }
      await refreshStatus();
    } catch (e) {
      appendLog(`Discover failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  }

  async function enrichAllWithoutEmail() {
    setLoading("enrich");
    appendLog("Enriching leads without email (website → Apollo)…");
    try {
      const result = await postApi<{
        ok: boolean;
        enriched: number;
        failed: number;
      }>("/api/enrichment/batch", { allWithoutEmail: true, limit: 25 });
      appendLog(`Enriched ${result.enriched} leads (${result.failed} errors)`);
      await refreshStatus();
    } catch (e) {
      appendLog(`Enrichment failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  }

  async function runManagerReport() {
    setLoading("manager");
    appendLog("Running Manager Agent (7-day analysis)…");
    try {
      const result = await postApi<{
        ok: boolean;
        data?: { recommendations?: Array<{ action: string; priority: string }> };
      }>("/api/control/manager-report", { periodDays: 7 });
      const recs = result.data?.recommendations ?? [];
      appendLog(
        recs.length
          ? `Manager report: ${recs.length} recommendations — ${recs[0]?.action}`
          : "Manager report completed"
      );
      await refreshStatus();
    } catch (e) {
      appendLog(`Manager report failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="mt-10 rounded-xl border border-indigo-900/50 bg-slate-900/80 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-indigo-300">Agent control</h2>
          <p className="mt-1 text-sm text-slate-400">
            Run agents from the dashboard — {leadCount} leads in CRM
          </p>
          {source === "GOOGLE_MAPS" && mapsStatus && (
            <p
              className={`mt-2 text-xs ${mapsStatus.mockMode ? "text-amber-400" : "text-emerald-400"}`}
            >
              Google Maps:{" "}
              {mapsStatus.mockMode
                ? "mock data (set GOOGLE_MAPS_API_KEY in .env)"
                : "live Places API"}
            </p>
          )}
          {enrichStatus && (
            <p className="mt-1 text-xs text-slate-500">
              Email enrichment: scrape {enrichStatus.websiteScrape ? "on" : "off"}
              {enrichStatus.apollo ? " · Apollo connected" : " · Apollo not configured"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => refreshStatus()}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
        >
          Refresh status
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-sm text-slate-400">Business type / search query</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            placeholder="e.g. HVAC companies, dental offices"
          />

          <label className="block text-sm text-slate-400">Location (city, state or region)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            placeholder="e.g. Austin, TX"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400">Max leads</label>
              <input
                type="number"
                min={1}
                max={20}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!!loading}
              onClick={() => runDiscover("sync")}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading === "discover" ? "Running…" : "Find & run pipeline"}
            </button>
            <button
              type="button"
              disabled={!!loading}
              onClick={() => runDiscover("async")}
              className="rounded-lg border border-indigo-600 px-4 py-2 text-sm text-indigo-300 hover:bg-indigo-950 disabled:opacity-50"
            >
              Queue discover (worker)
            </button>
            <button
              type="button"
              disabled={!!loading}
              onClick={enrichAllWithoutEmail}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              {loading === "enrich" ? "Enriching…" : "Enrich missing emails"}
            </button>
            <button
              type="button"
              disabled={!!loading}
              onClick={runManagerReport}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              {loading === "manager" ? "Analyzing…" : "Manager report"}
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-400">Activity log</h3>
          <div className="h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-400">
            {log.length === 0 ? (
              <p className="text-slate-600">Actions appear here…</p>
            ) : (
              log.map((line, i) => (
                <p key={i} className="mb-1">
                  {line}
                </p>
              ))
            )}
          </div>

          <h3 className="mb-2 mt-4 text-sm font-medium text-slate-400">Recent agent runs</h3>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
            {runs.length === 0 ? (
              <li className="text-slate-600">No runs yet</li>
            ) : (
              runs.map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between gap-2 rounded bg-slate-950 px-2 py-1"
                >
                  <span>
                    <span className="text-indigo-400">{r.agentType}</span>
                    {r.leadId && (
                      <span className="text-slate-600"> · {r.leadId.slice(0, 8)}…</span>
                    )}
                  </span>
                  <span
                    className={
                      r.status === "COMPLETED"
                        ? "text-emerald-500"
                        : r.status === "FAILED"
                          ? "text-red-400"
                          : "text-amber-400"
                    }
                  >
                    {r.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
