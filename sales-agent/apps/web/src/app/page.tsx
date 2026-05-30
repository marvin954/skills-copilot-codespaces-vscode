import { fetchApi } from "@/lib/api";

interface Metrics {
  leadsGenerated: number;
  emailsSent: number;
  repliesReceived: number;
  meetingsBooked: number;
  dealsClosed: number;
  revenueGenerated: number;
  conversionRate: number;
  avgLeadScore: number;
}

export default async function DashboardPage() {
  let metrics: Metrics | null = null;
  let error: string | null = null;

  try {
    metrics = await fetchApi<Metrics>("/api/dashboard/metrics");
  } catch {
    error = "API unavailable — start the API with npm run dev:api";
  }

  const cards = metrics
    ? [
        { label: "Leads (30d)", value: metrics.leadsGenerated },
        { label: "Emails sent", value: metrics.emailsSent },
        { label: "Replies", value: metrics.repliesReceived },
        { label: "Meetings", value: metrics.meetingsBooked },
        { label: "Deals closed", value: metrics.dealsClosed },
        {
          label: "Revenue",
          value: `$${metrics.revenueGenerated.toLocaleString()}`,
        },
        {
          label: "Conversion",
          value: `${metrics.conversionRate.toFixed(1)}%`,
        },
        { label: "Avg lead score", value: metrics.avgLeadScore },
      ]
    : [];

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Sales Command Center</h1>
      <p className="mb-8 text-slate-400">
        Autonomous pipeline for AI automation services — SMB B2B
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-800 bg-amber-950/50 p-4 text-amber-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-sm text-slate-400">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-xl font-semibold">Autonomous workflow</h2>
        <ol className="list-inside list-decimal space-y-2 text-slate-300">
          <li>Lead found (Maps, LinkedIn, directories)</li>
          <li>Research lead → pain, opportunity, angle</li>
          <li>Score lead (0–100)</li>
          <li>Personalized outreach (email / SMS / LinkedIn / voice)</li>
          <li>Conversation AI + objection handling</li>
          <li>Book meeting or close via Stripe</li>
          <li>Onboard customer + upsell</li>
        </ol>
      </section>
    </div>
  );
}
