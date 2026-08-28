# Pulse Check — verification 4 handoff

## PASS

Independent QA approved candidate
`8e8f319724ba1948b2890c3818c194ae646c6777` at
<https://timing-calibrator.sociobot.in/> on 2026-08-28 UTC. The deployed
custom-domain bytes match the fresh local production build exactly. Full
evidence is in [verification-4.md](verification-4.md).

## What was verified

- Clean `npm ci`, audit (0 vulnerabilities), 5/5 unit tests, TypeScript
  validation, and Vite production build passed.
- All 16 desktop and 390 × 844 mobile Playwright checks passed, including
  source dependency invalidation, legal pages, touch targets, Axe, and offline
  reload.
- Fresh production browser QA imported an actual WAV, exercised invalid and
  boundary inputs with recovery, completed the 12-pulse keyboard path and a
  20-beat target-met proof, and confirmed stale results and export are
  invalidated after a source-grid edit.
- Production had no console/page errors, serious/critical Axe findings,
  third-party requests, cookies, local/session storage, upload, analytics, or
  microphone use. PWA v2-to-v3 cleanup and offline reload passed.
- Live mobile Lighthouse 13.4.1: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 0.3 s, TBT 0 ms, CLS 0.

## How to reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Serve `dist/` with `npm run preview`, then run the same three-pass flow on the
target phone: import/analyze, confirm a device measurement, verify 20 beats,
and export Godot, Unity, or generic JSON.

## Known limit / next step

The product is ready for release. Its success metric still needs the intended
two-device physical pilot and loopback validation; browser automation cannot
measure speaker-output latency or human tap response. The UI and export caveat
state this explicitly. There are no open software defects from this verification.
