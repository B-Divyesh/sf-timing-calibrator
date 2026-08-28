# Pulse Check — verification 3 handoff

## Verdict: FAIL

Candidate `723dfac5f830c120f39afec9140b95c8dad1c993` was independently tested on
2026-08-28 from a clean checkout and against
<https://timing-calibrator.sociobot.in/>. The live HTML, hashed JS/CSS, service
worker, and mobile image match the local production build byte for byte.

The repaired blank anchor and blank manual offset paths pass, but a new P1
release blocker remains: changing an accepted source BPM or anchor after a
completed calibration does not invalidate device, verification, or export
state. Live reproduction showed an unchanged preview at BPM `120.2` while the
new download used unconfirmed BPM `130` combined with the old device and
verification measurements. The old result panels and downstream controls also
remain visible/enabled.

Full evidence, hashes, reproduction steps, and severity are in
`.factory/verification-3.md`. The prior failure is retained in
`.factory/verification-2.md`.

## Verification summary

```sh
npm ci
npm audit --audit-level=low
npm test
npm run build
npm run test:e2e
```

- Install/audit: 59 packages audited, 0 vulnerabilities.
- Unit tests: 5/5 passed.
- Type check and exact Vite production build: passed; `dist/` produced.
- Repository E2E: 12/12 passed in 36.4 s on desktop Chromium and 390 × 844
  mobile.
- Independent normal, boundary, malformed-file, recovery, download, clipboard,
  live keyboard, privacy, caching, and offline probes completed.
- Live Axe: zero serious/critical findings on desktop and mobile.
- Factory URL verifier: passed with no console/page errors.
- Lighthouse 12.8.2 live mobile: 100 Performance, 100 Accessibility,
  100 Best Practices, 100 SEO; FCP 0.9 s, LCP 0.9 s, TBT 10 ms, CLS 0.
- Initial JS is 14,170 bytes (5.91 KB gzip), CSS 10,780 bytes (3.29 KB gzip),
  and the mobile hero 10,688 bytes.
- Network requests were same-origin only; no cookies, local/session storage,
  uploads, analytics, or third-party runtime resources were observed.
- CSP, HSTS, referrer, MIME-sniffing, and camera/microphone/geolocation-denying
  policies are present. Assets are immutable for one year, HTML revalidates
  after 30 seconds, and `sw.js` is no-cache.
- Service-worker v2 activation removed a seeded v1 cache and offline reload
  succeeded.

No lint script exists; TypeScript validation runs as part of the build. This is
a static web product, so library/CLI consumer packaging and backend concurrency
or persistence checks do not apply. The two-device physical pilot success
metric could not be established in the browser-only container.

## Defects

- **P1 — stale downstream calibration after source edit:** release-blocking.
  Clear and disable device, verification, preview, and export state whenever
  audio/BPM/anchor changes; require reconfirmation and a fresh proof. Add a
  regression covering the downloaded JSON, not only visible source metrics.
- **P2 — footer touch targets:** Privacy (`52 × 24` px), Terms (`44 × 24` px),
  and Source (`51 × 24` px) are shorter than the required 44 px target on both
  desktop and mobile.

## Retained product limits

- Browser timing combines output, display/touch sampling, scheduling, and human
  response; validate release-critical offsets with physical loopback.
- Lightweight onset detection is best for percussive material and requires
  manual correction for dense, rubato, or tempo-changing tracks.
- Audio and calibration state stay in memory; only the versioned offline shell
  is persisted.

## Next step

Fix the P1 invalidation cascade, add regression coverage, deploy the repaired
build, and rerun independent verification. Do not approve this candidate.
