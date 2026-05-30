import { fetchApi } from "@/lib/api";

interface Lead {
  id: string;
  companyName: string;
  score: number;
  status: string;
  email: string | null;
  industry: string | null;
  research?: { salesAngle: string };
}

export default async function LeadsPage() {
  let leads: Lead[] = [];
  let error: string | null = null;

  try {
    leads = await fetchApi<Lead[]>("/api/leads");
  } catch {
    error = "Could not load leads";
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Leads</h1>
      {error && <p className="text-amber-400">{error}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Angle</th>
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
                <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                  {lead.research?.salesAngle ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && !error && (
          <p className="p-8 text-center text-slate-500">
            No leads yet. POST /api/leads/discover to generate leads.
          </p>
        )}
      </div>
    </div>
  );
}
