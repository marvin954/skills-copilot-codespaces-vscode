/**
 * Google Places API (New) — Text Search
 * https://developers.google.com/maps/documentation/places/web-service/text-search
 */

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.types",
  "places.businessStatus",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "nextPageToken",
].join(",");

const GENERIC_TYPES = new Set([
  "point_of_interest",
  "establishment",
  "premise",
  "geocode",
]);

export interface GooglePlaceResult {
  placeId: string;
  companyName: string;
  address: string;
  phone?: string;
  website?: string;
  googleMapsUri?: string;
  industry?: string;
  types: string[];
  businessStatus?: string;
}

interface PlacesSearchResponse {
  places?: Array<{
    id?: string;
    displayName?: { text?: string; languageCode?: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    googleMapsUri?: string;
    types?: string[];
    businessStatus?: string;
    primaryType?: string;
    primaryTypeDisplayName?: { text?: string };
  }>;
  nextPageToken?: string;
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
}

export function shouldUseGooglePlacesMock(): boolean {
  if (process.env.GOOGLE_PLACES_USE_MOCK === "true") return true;
  return !isGooglePlacesConfigured();
}

/** Build text query with optional location hint for regional results. */
export function buildPlacesTextQuery(query: string, location?: string): string {
  const q = query.trim();
  if (!location?.trim()) return q;
  const loc = location.trim();
  if (q.toLowerCase().includes(loc.toLowerCase())) return q;
  return `${q} in ${loc}`;
}

export function mapPlaceTypesToIndustry(
  types: string[],
  primaryType?: string,
  primaryLabel?: string
): string | undefined {
  if (primaryLabel) return primaryLabel;
  if (primaryType) return primaryType.replace(/_/g, " ");
  const specific = types.find((t) => !GENERIC_TYPES.has(t));
  return specific?.replace(/_/g, " ");
}

function normalizePlace(place: NonNullable<PlacesSearchResponse["places"]>[0]): GooglePlaceResult | null {
  const placeId = place.id?.replace(/^places\//, "") ?? "";
  const companyName = place.displayName?.text?.trim();
  if (!placeId || !companyName) return null;

  if (place.businessStatus === "CLOSED_PERMANENTLY") return null;

  const types = place.types ?? [];
  const industry = mapPlaceTypesToIndustry(
    types,
    place.primaryType,
    place.primaryTypeDisplayName?.text
  );

  return {
    placeId,
    companyName,
    address: place.formattedAddress ?? "",
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber,
    website: place.websiteUri,
    googleMapsUri: place.googleMapsUri,
    industry,
    types,
    businessStatus: place.businessStatus,
  };
}

export interface SearchGooglePlacesParams {
  textQuery: string;
  maxResults?: number;
  /** Optional circle bias (lat/lng from Geocoding or manual) */
  locationBias?: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
  };
}

export async function searchGooglePlaces(
  params: SearchGooglePlacesParams
): Promise<GooglePlaceResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not set. See sales-agent/docs/GOOGLE_MAPS_SETUP.md"
    );
  }

  const maxResults = Math.min(Math.max(params.maxResults ?? 10, 1), 60);
  const collected: GooglePlaceResult[] = [];
  let pageToken: string | undefined;

  while (collected.length < maxResults) {
    const pageSize = Math.min(20, maxResults - collected.length);

    const body: Record<string, unknown> = {
      textQuery: params.textQuery,
      languageCode: "en",
      maxResultCount: pageSize,
    };

    if (params.locationBias) {
      body.locationBias = {
        circle: {
          center: {
            latitude: params.locationBias.latitude,
            longitude: params.locationBias.longitude,
          },
          radius: params.locationBias.radiusMeters ?? 50_000,
        },
      };
    }

    if (pageToken) {
      body.pageToken = pageToken;
    }

    const res = await fetch(PLACES_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    if (!res.ok) {
      throw new Error(
        `Google Places API ${res.status}: ${parseGoogleError(raw)}`
      );
    }

    const data = JSON.parse(raw) as PlacesSearchResponse;

    for (const place of data.places ?? []) {
      const normalized = normalizePlace(place);
      if (!normalized) continue;
      if (collected.some((c) => c.placeId === normalized.placeId)) continue;
      collected.push(normalized);
      if (collected.length >= maxResults) break;
    }

    pageToken = data.nextPageToken;
    if (!pageToken || collected.length >= maxResults) break;

    // Google requires a short delay before using nextPageToken
    await new Promise((r) => setTimeout(r, 300));
  }

  return collected;
}

function parseGoogleError(raw: string): string {
  try {
    const j = JSON.parse(raw) as { error?: { message?: string; status?: string } };
    return j.error?.message ?? raw.slice(0, 200);
  } catch {
    return raw.slice(0, 200);
  }
}

/** Optional: Geocode a location string for search bias (uses Geocoding API). */
export async function geocodeLocation(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || !address.trim()) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status?: string;
    results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
  };

  if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
    return null;
  }

  const { lat, lng } = data.results[0].geometry.location;
  if (lat == null || lng == null) return null;
  return { latitude: lat, longitude: lng };
}
