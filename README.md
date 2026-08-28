# Pulse Check

Pulse Check helps rhythm-game and mobile music-app makers separate a drifting
source grid from device playback delay. It analyzes local audio onsets, lets a
maker correct the BPM and first-beat anchor, measures a target device with a
tap/click test, verifies 20 corrected beats, and exports Godot, Unity, or generic
JSON.

The utility is free, static, local-first, and intended for use on the actual
phones and output routes players will use. Browser timing is an estimate, not a
substitute for physical loopback measurement.

## Develop

Requirements: Node.js 20 or newer.

```sh
npm install
npm run dev
```

Then open the URL shown by Vite. No server, account, API key, microphone, or
network connection is required after the first load.

## Test and build

```sh
npm test
npm run build
npm run test:e2e
```

`npm run build` is the deployment command. It writes the static application to
`dist/`, with `dist/index.html` at its root. End-to-end tests use Playwright
1.58.2 and exercise desktop Chromium plus a 390 × 844 mobile viewport.

## How measurements work

1. Short-window energy changes identify likely onsets in the selected audio.
2. Onsets are compared with an editable BPM/anchor grid to estimate median
   alignment error and drift per minute.
3. Taps against 12 Web Audio/visual pulses produce a median device offset and
   median absolute deviation (jitter). A known external measurement can be
   entered instead.
4. A 20-beat run subtracts that offset and reports median absolute residual,
   90th percentile, and beats within 20 ms.

Audio and timing data stay in memory. The only persistent browser data is the
offline application cache. See `/privacy/` and `/terms/` in the built site.

## Deploy

Deploy the contents of `dist/` to Azure Static Web Apps. The included
`staticwebapp.config.json` supplies security and cache headers; `sw.js` provides
an offline shell. Factory deployment, DNS, and billing are intentionally outside
this repository.

## License

MIT. The generated editorial image is original to this product; prompt and
provenance are recorded in `.factory/design.md` and `assets/src/`.
