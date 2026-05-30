/**
 * Server-side fetch on the VM uses the Express API directly.
 * Browser/client code should use /api-backend (Next.js rewrite) so one
 * forwarded port (3000) is enough when developing remotely.
 */
function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api-backend";
  }
  return process.env.INTERNAL_API_URL ?? "http://127.0.0.1:4000";
}

export async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}
