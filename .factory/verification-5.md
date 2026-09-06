# Verify track drift and device delay — verification 5

## Verdict: FAIL

Implementation reviewed: `47c8bbf9c6feda9fd0c92af28bdc32bdc79bde35`  
Documentation baseline: `2f4b14f22735343a9d024a1c357db9c7d63f20e1`  
Live URL: <https://timing-calibrator.sociobot.in/>  
Verified: 2026-09-06 UTC  
Findings: 2 P2  
Untested public claims: 2

The live product matches the implementation build and the calibration workflow
passes. It cannot receive a PASS because the claim ledger omits two public
promises and three secondary pages do not identify their GitHub link as
external. No product code was changed.

## First screen before scrolling

Fresh desktop at 1440 × 1000 and phone at 390 × 844 showed:

- Job: separate track drift from device delay.
- Audience: rhythm-game and music-app makers testing a target phone.
- First action: **Try it with sample data**.
- The action explains that it opens a steady 120 BPM result.
- Three facts cover account/payment, local audio, and offline use.

Both views had one `h1`, one `main`, `lang="en"`, no overflow, and no
console error. Screenshots are
`/work/.evidence/live-desktop-first-screen.png` and
`/work/.evidence/live-phone-first-screen.png`.

## Findings

### P2 — two public promises are absent from the claims ledger

All 14 entries in `.factory/claims.json` have exactly one matching tag, and
every declared command passes. The ledger remains incomplete:

1. The live result offers **Copy JSON**. The `engine-json-export` test
   downloads JSON but never uses the clipboard action.
2. README promises no advertising, analytics, or microphone access. The
   `local-privacy` entry only declares no cookies and no third-party runtime
   requests; its test does not assert the omitted promises.

Ad hoc live checks found the current behavior correct: copied JSON parsed,
clipboard denial showed recovery guidance, requests stayed same-origin,
cookies were empty, and the live Permissions Policy denies microphone access.
That does not supply the tagged sandbox coverage required on every build.

Add one claim entry and outcome test for each promise, or remove the promise.
Untested public claim count: 2.

### P2 — secondary-page GitHub links are not marked as external

The landing and demo accessible name is **Source (opens GitHub)**. On
`/privacy/`, `/terms/`, and the designed 404 page, the same external link
is only named **Source**. This fails the site-structure rule that external links
say so. All destinations resolve; this is not a broken-link defect.

## Live workflow and edge paths

- `/demo` and `/?demo=1` opened a populated sample without setup.
- The persistent demo label, Reset demo, and Start for real controls worked.
- The sample reported 120 BPM, 15 onsets, `+0.0 ms` drift, and a steady grid.
- A real-data sentinel survived demo entry, reset, and exit. Only
  `demo:pulse-check:session` was used for demo storage, then removed on exit.
- Blank and ±1001 ms manual values were rejected. −1000 ms and explicit zero
  were accepted.
- BPM 29.9 and 300.1 and a negative or blank anchor were rejected. BPM 30 and
  300 and an explicit zero anchor were accepted.
- Corrupt audio and audio with fewer than four onsets showed useful errors;
  Reset demo recovered.
- Alternating Space and Enter completed the 12-pulse phone flow.
- A zero-offset run completed 20/20 beats and populated Godot, Unity, and
  generic JSON.
- Editing the confirmed source cleared device, proof, and export state.
- Stop controls, clipboard success, and clipboard-denial recovery worked.
- Back and Forward restored the mode, focused the `h1`, and announced it.
- Text at 200% retained the workflow without horizontal overflow.

## Structure, accessibility, privacy, and offline

- `/`, `/demo`, `/privacy/`, and `/terms/` returned 200 with distinct
  titles and one `h1`.
- An unknown path returned the expected designed HTTP 404 with a way home.
- Every crawled destination link returned 2xx.
- The URL verifier passed title, language, main, alt text, and console checks.
- Live Axe WCAG 2 A/AA found zero violations on desktop and phone.
- The skip link was first with visible focus. Visible controls, including
  footer links, measured at least 44 × 44 CSS px.
- Reduced motion removed pulse transforms and reduced transitions to 0.01 ms.
- Runtime requests stayed same-origin; there were no cookies or session data.
- Offline reload restored the demo and notice. Activation replaced a seeded
  `pulse-check-v3` cache with `pulse-check-v4`.

This static local-first product has no backend. Tenant isolation, restart
persistence, health, and 429/Retry-After checks do not apply.

## Clean-checkout gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 60 packages; 0 vulnerabilities |
| `npm test` | PASS — 6/6 |
| `npm run build` | PASS — type check and Vite build; `dist/` produced |
| `npm run test:e2e` | PASS — 32/32 desktop and phone checks |
| `npm audit --audit-level=low` | PASS — 0 vulnerabilities |
| Lint | N/A — no script or configuration |
| Lighthouse 13.4.1 mobile | 100 Performance, Accessibility, Best Practices, and SEO |
| Lighthouse metrics | FCP 0.9 s; LCP 0.9 s; TBT 0 ms; CLS 0 |

Built assets pass budget: JS 17,143 bytes / 6,899 gzip; CSS 12,316 bytes /
3,639 gzip; mobile hero 10,688 bytes; desktop hero 74,678 bytes; no fonts.

## Declared claims

Every command was run separately after the clean build.

| Claim | Result |
| --- | --- |
| `demo-one-click` | PASS |
| `demo-isolation` | PASS |
| `steady-reference-track` | PASS |
| `local-audio-onsets` | PASS |
| `audio-size-limit` | PASS |
| `device-tap` | PASS |
| `manual-offset` | PASS |
| `twenty-beat-proof` | PASS |
| `engine-json-export` | PASS |
| `local-privacy` | PASS |
| `offline-reload` | PASS |
| `no-account-sample` | PASS |
| `required-measurements` | PASS |
| `dependent-results-reset` | PASS |

## Release identity

Local and live SHA-256 hashes match.

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `dcc50680defbf1f5c280ee8bc155191af0d027cca84c9e90af66221d837d3101` |
| `assets/index-DDI4b7EV.js` | `63c7e7e3a9afa4df6cf56d1e1cdce44ffef51e96fedeea937e115fea559ae737` |
| `assets/index-D3kRqf0K.css` | `44b17ede6097186d5dcee87ed2e90fddb661327e81ec6b1f1f2aeecdebb369fe` |
| `sw.js` | `ad488aafd613ddf7c2d7feecabd4149bb6bf4353a040f33885a35602ec62206c` |
| `privacy/index.html` | `06632ed8df9d4d811dbf38be3273cdd7eba08b07e77b8eeec9456a6abcd84f50` |
| `terms/index.html` | `b395027f8426166012e928b6d930750a3558647735055816e44979df8824b5fc` |
| `404.html` | `0287323d57cf13d959786fc91405a3b6f41eb621b3af1bc28f3dccb4540f1076` |

Remote main was `2f4b14f` before reporting. Later commits than `47c8bbf`
are documentation-only, so `47c8bbf` is the implementation candidate.

## Earlier findings

| Earlier finding | Disposition |
| --- | --- |
| Blank manual offset became zero | Fixed; blank rejects and explicit zero works. |
| Blank anchor became zero | Fixed; blank rejects and preserves the result. |
| Source edits retained stale results | Fixed; live and tagged tests clear dependencies. |
| Footer targets were under 44 px | Fixed; all are at least 44 px high. |
| No isolated demo | Fixed; direct routes, banner, reset, exit, and namespace pass. |
| Steady sample diagnosed drift | Fixed; 120 BPM and zero drift. |
| No claims manifest | Fixed for 14 entries; two omitted claims remain. |
| Unclear first screen | Fixed on desktop and phone. |
| Metadata and shared navigation | Earlier gaps fixed; external-link consistency remains. |
| Unknown URLs rendered the landing page | Fixed with designed HTTP 404. |
| Duplicate demo route | Fixed; one valid rewrite is deployed. |
| Manual offset action lacked a stable name | Fixed; **Use known offset** is exposed. |

## Remaining field validation

A physical loopback and a two-device pilot are still required to establish the
real-device median error below 20 ms. The product discloses this limit, so it is
not counted as an untested claim.
