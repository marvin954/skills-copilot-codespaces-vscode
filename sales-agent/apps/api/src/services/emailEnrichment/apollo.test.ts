import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { enrichEmailFromApollo, isApolloConfigured } from "./apollo.js";

describe("apollo enrichment", () => {
  const originalKey = process.env.APOLLO_API_KEY;
  const originalFetch = globalThis.fetch;

  after(() => {
    if (originalKey === undefined) delete process.env.APOLLO_API_KEY;
    else process.env.APOLLO_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  });

  it("isApolloConfigured reflects env", () => {
    process.env.APOLLO_API_KEY = "test";
    assert.equal(isApolloConfigured(), true);
  });

  it("returns person email from Apollo search", async () => {
    process.env.APOLLO_API_KEY = "test-key";

    globalThis.fetch = mock.fn(async (url: string | URL) => {
      const u = String(url);
      if (u.includes("mixed_people/search")) {
        return new Response(
          JSON.stringify({
            people: [
              {
                id: "p1",
                name: "Jane Smith",
                title: "Owner",
                email: "jane@acme.com",
                email_status: "verified",
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    }) as typeof fetch;

    const result = await enrichEmailFromApollo(
      "Acme HVAC",
      "https://www.acme.com"
    );

    assert.ok(result);
    assert.equal(result?.email, "jane@acme.com");
    assert.equal(result?.source, "apollo");
    assert.equal(result?.contactName, "Jane Smith");
  });
});
