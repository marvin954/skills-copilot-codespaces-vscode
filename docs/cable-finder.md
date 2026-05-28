# Cable Finder implementation

The app uses a local service catalog to determine whether a telecom provider can serve a customer address.

## Flow

1. The customer enters an address in the web form or passes it with `--address`.
2. `parseAddress()` normalizes the address and extracts ZIP, city, state, unit, street tokens, and business indicators.
3. `findAvailability()` compares those fields against the service catalog.
4. The app returns matching internet products, speed tiers, installation notes, and match reasons.

## Catalog rules

Each catalog entry includes:

- Coverage ZIP codes and cities.
- Optional street keywords for street-level plant checks.
- Business eligibility flags.
- Speed tiers and installation information.

Entries can be added in `src/data/serviceCatalog.js` without changing the UI or API.
