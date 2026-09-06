# Pulse Check — repair 4 handoff

## Outcome

PASS. Pulse Check now has a direct isolated `/demo`, a steady clean 120 BPM
reference result, an outcome-tested public-claims manifest, plain first-screen
copy, complete static metadata, shared route chrome, and a designed HTTP 404.

Implementation deployed: `47c8bbf9c6feda9fd0c92af28bdc32bdc79bde35`  
Documentation evidence: `ef4b4521ee63f0056a03f26e69ff93d54902338e`  
Live URL: <https://timing-calibrator.sociobot.in/>

## What changed

- Added `/demo` and `?demo=1`, a persistent demo label, Reset demo, Start for
  real, and the separate `demo:pulse-check:session` localStorage namespace.
- Reworked reference onset timing so the displayed 120 BPM clean sample reports
  15 onsets, `+0.0 ms` drift, and a steady source grid.
- Added `.factory/claims.json` with 14 tagged Playwright outcome tests, plus
  `.factory/demo.md` and the required copy audit.
- Rewrote the first screen around the job, audience, and sample action.
- Added canonical, Open Graph, Twitter, apple-touch, social-preview, sitemap,
  shared header/footer, legal page treatment, secure headers, and `404.html`.
- Kept the previous input-validation, stale-dependency, keyboard, touch-target,
  offline, privacy, and export safeguards under regression coverage.

## Verification

From clean dependencies: `npm ci`, `npm test` (6), `npm run build`,
`npm run test:e2e` (32), and `npm audit --audit-level=low` all passed. Every
declared claim command passed individually after build.

Live verification passed for desktop and 390 px phone, demo reset/isolation,
offline reload, privacy requests, legal routes, designed 404, Axe WCAG 2 A/AA,
and the factory URL verifier. Lighthouse mobile scored 100 for Performance,
Accessibility, Best Practices, and SEO; FCP/LCP were 0.9 s, TBT 0 ms, and CLS
0. Full evidence is at `/work/.evidence/qa-report.md` and
`/work/.evidence/qa-result.json`.

## Known limit

Browser timing is still an estimate. A physical loopback and two-device pilot
remain necessary for the brief’s real-device under-20 ms outcome.
