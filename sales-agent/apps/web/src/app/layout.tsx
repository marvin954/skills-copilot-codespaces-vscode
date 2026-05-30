import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales Agent CRM",
  description: "Autonomous B2B AI sales dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="text-lg font-semibold text-brand-500">
              AI Sales Agent
            </span>
            <div className="flex gap-6 text-sm text-slate-400">
              <a href="/" className="hover:text-white">
                Dashboard
              </a>
              <a href="/leads" className="hover:text-white">
                Leads
              </a>
              <a href="/deals" className="hover:text-white">
                Deals
              </a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
