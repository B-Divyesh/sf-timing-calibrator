# Pulse Check — repair handoff

## Independent verification 2: repaired (2026-08-28)

Candidate `f3020b5050be06158a7309f4cd8184dc31c45b2d` failed because
`Number("")` silently converted both a blank manual output offset and a blank
first-beat anchor into zero. This repair adds `readRequiredNumber`, which checks
for a non-empty value before conversion. A blank manual entry now announces an
error, creates no device result, and cannot be confirmed or exported. A blank
anchor now announces an error and retains the current source grid. An explicit
zero remains valid in both flows.

The service-worker revision is also bumped to `pulse-check-v2`, ensuring that
clients with the prior cache-first offline shell receive this repaired release.
The original independent report remains in `.factory/verification-2.md`.

## Delivered

- A complete, static Vite + TypeScript timing workflow:
  - local audio import/decoding with a 50 MB guard and readable error states;
  - short-window energy onset detection with editable BPM and first-beat anchor;
  - source-grid diagnosis using median timing error and drift per minute;
  - 12-pulse device test using Web Audio and/or a visual cue, with pointer,
    Space, and Enter input and robust median/MAD results;
  - accessible manual-offset route for external loopback or camera measurements;
  - 20-beat verification reporting median absolute error, p90, and hits under
    the 20 ms pilot target;
  - downloadable/copyable Godot 4, Unity, and generic JSON exports.
- Local-first privacy: no uploads, microphone, analytics, cookies, account, or
  third-party runtime resources. The `pulse-check-v2` service worker precaches
  the shell and hashed build assets for offline reuse.
- Responsive monochrome broadsheet system for desktop and 390 px mobile,
  including focus states, reduced-motion behavior, semantic landmarks, a single
  page h1, text alternatives for the canvas, and 44 px controls.
- Original generated calibration-bench image, reviewed for text/brand/anatomy
  artifacts and optimized to 12 KB mobile and 75 KB desktop WebP. Source and
  prompt sidecars are in `assets/src/`; provenance is in `.factory/design.md`.
- Direct `/privacy/` and `/terms/` pages, MIT license, deployment headers,
  robots/sitemap, and expanded project documentation.

## Verification

Run from a clean checkout with Node.js 20+:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

- `npm ci`: 59 packages audited, zero vulnerabilities.
- `npm test`: 5/5 unit tests passed (statistics, drift, BPM, onset detection).
- `npm run build`: passed with Vite 7.3.6; output is `dist/` with
  `dist/index.html` at its root. Initial JS is 14.17 KB (5.91 KB gzip), CSS is
  10.78 KB (3.29 KB gzip), and the largest image is 74.68 KB.
- `npm run test:e2e`: 12/12 passed in 30.2 seconds with Playwright 1.58.2,
  covering the entire
  sample → source confirm → manual device measurement → 20-beat verify → export
  preview journey; both new blank-number regressions (including intentional
  zero controls); legal routes; and offline reloads on desktop Chromium and a
  390 × 844 mobile viewport.
- Axe WCAG 2 A/AA scan: zero serious or critical findings on desktop and mobile.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 0 ms, CLS 0.
- A 390 px keyboard smoke test verified that the skip link is the first Tab
  stop and that Space records a pulse, with no console errors.
- A fresh browser privacy/offline smoke test found only same-origin runtime
  requests, no cookies, localStorage, or sessionStorage, an active
  `pulse-check-v2` cache, and a successful offline reload with the offline note.
- The static Azure response policy remains self-only CSP, denied
  camera/microphone/geolocation, `nosniff`, strict referrer policy, immutable
  asset caching, and a no-cache service worker. No consumer package applies to
  this static-web artifact.

## Live deployment

- Repair code commit `2168be2547b69a5d1009611012836ea8c5bbc8c3` was pushed to
  `main` and deployed with `swa deploy ./dist --env production --resource-group
  sociobot --app-name sf-timing-calibrator` to
  `https://gentle-plant-0eb1d730f.7.azurestaticapps.net`.
- The production custom domain `https://timing-calibrator.sociobot.in/` now
  matches the local production build exactly: `index.html` SHA-256
  `9d00e7aef79f97da1913b4f5993df8b3c75d16b7520c2f505f74cf04025c1170` and
  `sw.js` SHA-256
  `fb773f8ae5db70caa46cf27595a7ec171287126798d8a565ef9f3f922b8c1d75`.
- Live HTTPS returned the configured CSP, HSTS, strict referrer policy,
  `nosniff`, and camera/microphone/geolocation-denying Permissions-Policy. A
  fresh 390 px browser session reproduced the repaired blank-manual-offset
  error, retained a hidden device result, used only the production origin, and
  logged no console errors.

## Known limits

- Browser timing cannot directly observe speaker output. Tap results combine
  playback/display/touch latency and human response; the UI and export state
  this limitation. Use the manual route with a physical loopback for
  release-critical values.
- Onset detection is intentionally lightweight and works best on percussive
  material. Dense or rubato music may require manual BPM/anchor correction.
- Imported audio is analyzed from its first decoded channel and is kept only in
  memory; no project persistence is intentional for v1 privacy.

## Next steps

- Pilot on at least two physical target phones and compare exports against a
  loopback measurement.
- Add multi-anchor piecewise drift fitting if pilot teams regularly test long,
  tempo-changing source tracks.
