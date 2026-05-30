"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi, postApi } from "@/lib/api";

interface Lead {
  id: string;
  companyName: string;
  score: number;
  status: string;
  email: string | null;
  industry: string | null;
  research?: { salesAngle: string };
}

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchApi<Lead[]>("/api/leads");
      setLeads(data);
    } catch {
      setMessage("Could not load leads — check API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runPipeline(leadId: string) {
    setActionId(leadId);
    setMessage(null);
    try {
      const result = await postApi<{ ok: boolean; score?: number }>(
        `/api/control/pipeline/${leadId}`
      );
      setMessage(`Pipeline done — score ${result.score ?? "?"}`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Pipeline failed");
    } finally {
      setActionId(null);
    }
  }

  async function createCheckout(leadId: string, companyName: string) {
    setActionId(leadId);
    try {
      const result = await postApi<{
        ok: boolean;
        data?: { checkoutUrl?: string };
      }>("/api/control/checkout", { leadId, amount: 2500 });
      const url = result.data?.checkoutUrl;
      setMessage(url ? `Checkout ready for ${companyName}` : "Checkout created");
      if (url) window.open(url, "_blank");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading leads…</p>;
  }

  return (
    <div>
      {message && (
        <p className="mb-4 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
          {message}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-slate-800">
                <td className="px-4 py-3 font-medium">{lead.companyName}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      lead.score >= 70
                        ? "text-emerald-400"
                        : lead.score >= 50
                          ? "text-amber-400"
                          : "text-slate-400"
                    }
                  >
                    {lead.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{lead.status}</td>
                <td className="px-4 py-3 text-slate-400">
                  {lead.industry ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionId === lead.id}
                      onClick={() => runPipeline(lead.id)}
                      className="rounded bg-indigo-600/80 px-2 py-1 text-xs text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {actionId === lead.id ? "…" : "Run pipeline"}
                    </button>
                    <button
                      type="button"
                      disabled={actionId === lead.id}
                      onClick={() => createCheckout(lead.id, lead.companyName)}
                      className="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-950 disabled:opacity-50"
                    >
                      Checkout $2.5k
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <p className="p-8 text-center text-slate-500">
            No leads yet — use Agent control on the dashboard to discover leads.
          </p>
        )}
      </div>
    </div>
  );
}
