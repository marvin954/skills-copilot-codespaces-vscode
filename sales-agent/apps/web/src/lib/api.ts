/**
 * Server-side fetch on the VM uses the Express API directly.
 * Browser/client code uses /api-backend (Next.js rewrite).
 */
function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api-backend";
  }
  return process.env.INTERNAL_API_URL ?? "http://127.0.0.1:4000";
}

export async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${path}${text ? ` — ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export async function postApi<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : "{}",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `API ${res.status}: ${path}`
    );
  }
  return data as T;
}
