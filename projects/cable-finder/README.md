# Cable Finder

Cable Finder is a small telecom availability app. Customers enter an address, and the app returns every internet service in the local catalog that can serve that location.

## Features

- Browser form for customer address lookups.
- JSON API for serviceability checks.
- CLI lookup mode for quick terminal checks.
- Address parsing for city, state, ZIP, unit, and business indicators.
- Structured service catalog with fiber, cable, fixed wireless, DSL, and dedicated business internet options.

## Run the app

```bash
cd projects/cable-finder
npm start
```

Then open `http://127.0.0.1:3000`.

## CLI lookup

```bash
cd projects/cable-finder
node src/index.js --address "1200 Main St, Springfield, IL 62704"
```

## API lookup

```bash
cd projects/cable-finder
curl "http://127.0.0.1:3000/api/availability?address=1200%20Main%20St%2C%20Springfield%2C%20IL%2062704"
```

## Example addresses

- `1200 Main St, Springfield, IL 62704` returns residential fiber and cable options.
- `88 Commerce Plaza Suite 400, Springfield, IL 62701` returns business dedicated internet and cable options.
- `1 Remote Farm Road, Nowhere, IL 99999` returns no active services.

## Test

```bash
cd projects/cable-finder
npm test
```
