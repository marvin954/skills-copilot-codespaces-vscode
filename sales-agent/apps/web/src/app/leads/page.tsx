import { LeadsTable } from "@/components/LeadsTable";
import Link from "next/link";

export default function LeadsPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Link
          href="/"
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          ← Back to agent control
        </Link>
      </div>
      <LeadsTable />
    </div>
  );
}
