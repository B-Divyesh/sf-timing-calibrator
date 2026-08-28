# Pulse Check — build handoff

## Independent verification 2: FAIL (2026-08-28)

Candidate `f3020b5050be06158a7309f4cd8184dc31c45b2d` is live at
<https://timing-calibrator.sociobot.in/> and its live HTML/JS/CSS SHA-256
values exactly match the fresh production build. Clean install, 5/5 unit
tests, type/build, 8/8 desktop/mobile Playwright tests, live axe scans,
offline reload, headers, privacy/network checks, and live Lighthouse all
passed. The release nevertheless **FAILS** acceptance because an empty
manual known-offset field is accepted as a confirmed/exportable `0 ms`
measurement; it can create a false engine timing correction in the required
accessible/manual workflow. A cleared source anchor also silently becomes
zero. Full repro, evidence, metrics, and severity are in
`.factory/verification-2.md`. No product code was changed by this verification.

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
  third-party runtime resources. A versioned service worker precaches the shell
  and hashed build assets for offline reuse.
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
npm install
npm test
npm run build
npm run test:e2e
```

- `npm test`: 5/5 unit tests passed (statistics, drift, BPM, onset detection).
- `npm run build`: passed with Vite 7.3.6; output is `dist/` with
  `dist/index.html` at its root.
- `npm run test:e2e`: 8/8 passed in Playwright 1.58.2, covering the entire
  sample → source confirm → manual device measurement → 20-beat verify → export
  preview journey on desktop Chromium and a 390 × 844 mobile viewport, plus
  legal routes, offline reloads, and console-error checks.
- Axe WCAG 2 A/AA scan: zero serious or critical findings on desktop and mobile.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0.
- Production payload: 14.13 KB JS (5.88 KB gzip), 10.78 KB CSS (3.29 KB gzip),
  76 KB largest hero image. `npm audit`: zero vulnerabilities.

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
