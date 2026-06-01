import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractDomain,
  extractEmailsFromText,
  pickBestEmail,
  isLikelyBusinessEmail,
} from "./utils.js";

describe("email enrichment utils", () => {
  it("extractDomain normalizes www", () => {
    assert.equal(extractDomain("https://www.acme.com/about"), "acme.com");
  });

  it("extractEmailsFromText filters junk", () => {
    const html = `
      Contact us at hello@acme.com or noreply@acme.com
      Bad: test@example.com image@test.png
    `;
    const emails = extractEmailsFromText(html);
    assert.ok(emails.includes("hello@acme.com"));
    assert.ok(!emails.some((e) => e.includes("example.com")));
    assert.ok(!emails.some((e) => e.endsWith(".png")));
  });

  it("pickBestEmail prefers domain match", () => {
    const picked = pickBestEmail(
      ["info@gmail.com", "john@acme.com", "sales@other.com"],
      "acme.com"
    );
    assert.equal(picked?.email, "john@acme.com");
    assert.equal(picked?.confidence, "high");
  });

  it("isLikelyBusinessEmail rejects noreply", () => {
    assert.equal(isLikelyBusinessEmail("noreply@acme.com"), false);
    assert.equal(isLikelyBusinessEmail("owner@acme.com"), true);
  });
});
