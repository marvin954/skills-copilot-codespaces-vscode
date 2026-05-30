import { fetchApi } from "@/lib/api";

interface Deal {
  id: string;
  title: string;
  stage: string;
  amount: string;
  lead: { companyName: string };
}

export default async function DealsPage() {
  let deals: Deal[] = [];
  try {
    deals = await fetchApi<Deal[]>("/api/deals");
  } catch {
    /* empty */
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Deals</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="font-semibold">{deal.title}</p>
            <p className="text-sm text-slate-400">{deal.lead.companyName}</p>
            <div className="mt-4 flex justify-between">
              <span className="rounded bg-brand-600/20 px-2 py-1 text-xs text-brand-500">
                {deal.stage}
              </span>
              <span className="font-mono text-emerald-400">
                ${Number(deal.amount).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      {deals.length === 0 && (
        <p className="text-slate-500">No deals in pipeline yet.</p>
      )}
    </div>
  );
}
