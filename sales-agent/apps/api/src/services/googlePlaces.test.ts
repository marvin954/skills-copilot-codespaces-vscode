import { describe, it, mock, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  buildPlacesTextQuery,
  mapPlaceTypesToIndustry,
  searchGooglePlaces,
  isGooglePlacesConfigured,
} from "./googlePlaces.js";

describe("googlePlaces helpers", () => {
  it("buildPlacesTextQuery appends location when missing", () => {
    assert.equal(
      buildPlacesTextQuery("dental offices", "Austin TX"),
      "dental offices in Austin TX"
    );
    assert.equal(
      buildPlacesTextQuery("dental offices Austin TX", "Austin TX"),
      "dental offices Austin TX"
    );
  });

  it("mapPlaceTypesToIndustry prefers primary label", () => {
    assert.equal(
      mapPlaceTypesToIndustry(["establishment"], "dentist", "Dentist"),
      "Dentist"
    );
  });
});

describe("searchGooglePlaces", () => {
  const originalKey = process.env.GOOGLE_MAPS_API_KEY;
  const originalFetch = globalThis.fetch;

  after(() => {
    if (originalKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  });

  it("throws when API key missing", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    await assert.rejects(() =>
      searchGooglePlaces({ textQuery: "coffee shop" })
    );
  });

  it("parses Places API response", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-key";

    globalThis.fetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({
          places: [
            {
              id: "places/ChIJtest",
              displayName: { text: "Austin Dental Care" },
              formattedAddress: "123 Main St, Austin, TX",
              nationalPhoneNumber: "+1 512-555-0100",
              websiteUri: "https://austindental.example.com",
              googleMapsUri: "https://maps.google.com/?cid=123",
              types: ["dentist", "health"],
              businessStatus: "OPERATIONAL",
              primaryType: "dentist",
              primaryTypeDisplayName: { text: "Dentist" },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const results = await searchGooglePlaces({
      textQuery: "dental offices Austin TX",
      maxResults: 5,
    });

    assert.equal(results.length, 1);
    assert.equal(results[0].companyName, "Austin Dental Care");
    assert.equal(results[0].placeId, "ChIJtest");
    assert.equal(results[0].website, "https://austindental.example.com");
    assert.equal(results[0].industry, "Dentist");
  });
});

describe("isGooglePlacesConfigured", () => {
  it("returns false when key empty", () => {
    const prev = process.env.GOOGLE_MAPS_API_KEY;
    process.env.GOOGLE_MAPS_API_KEY = "";
    assert.equal(isGooglePlacesConfigured(), false);
    if (prev) process.env.GOOGLE_MAPS_API_KEY = prev;
  });
});
