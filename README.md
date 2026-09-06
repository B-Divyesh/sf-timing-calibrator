# Pulse Check

Pulse Check helps rhythm-game makers and mobile music-app builders separate a
drifting track grid from target-device playback delay. It analyzes selected
local audio, measures a device with taps or a known offset, verifies 20 beats,
and exports Godot, Unity, or generic JSON settings.

Start at `/demo` to load the steady 120 BPM reference track in an isolated
browser sandbox. No account or payment details are needed for the sample.

## Privacy and limits

Audio and measurements stay in the browser. The app uses no cookies,
advertising, analytics, microphone access, or third-party runtime requests.
Its service worker supports offline reload after the first visit. Browser timing
is an estimate, so release-critical work still needs a physical loopback and
tests on each target device.

See [Privacy](/privacy/) and [Terms](/terms/) for details. The demo lifecycle,
sample, and separate storage key are documented in `.factory/demo.md`.

## Develop

Requirements: Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the local URL shown by Vite. Use `/demo` for the direct sample or choose a
local audio file for a real calibration.

## Test and build

From a clean checkout:

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm audit --audit-level=low
```

`npm test` runs the unit regression suite. `npm run test:e2e` runs desktop and
390 px browser checks. Every public product claim is declared in
`.factory/claims.json`; after `npm run build`, run each command in that file.
For example:

```sh
npm run test:e2e -- --project=chromium --grep @claim:offline-reload
```

`npm run build` writes the deployable static site to `dist/`, with
`dist/index.html` at its root.

## How the calibration works

1. Select local audio. Pulse Check marks likely energy onsets.
2. Adjust the BPM and first-beat anchor until the track grid is credible.
3. Confirm the source, then tap 12 pulses or enter an external known offset.
4. Confirm the device offset and run the 20-beat verification.
5. Export the matching Godot, Unity, or generic JSON correction.

Files above 50 MB are rejected before decoding. A blank measurement is never
treated as a zero measurement, and changing a confirmed source grid clears
every dependent device, proof, and export result.

## Deploy

Deploy `dist/` to Azure Static Web Apps. `staticwebapp.config.json` provides
security and cache headers, the `/demo` rewrite, and the designed 404 response.
`sw.js` caches the application shell for offline reload. Factory deployment,
DNS, and billing are outside this repository.

## License

MIT. The editorial illustration is original generated work for Pulse Check.
Its prompt and provenance are recorded in `.factory/design.md` and
`assets/src/`.
