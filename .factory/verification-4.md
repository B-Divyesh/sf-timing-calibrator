# Pulse Check — independent verification 4

## Verdict: PASS

**Candidate and deployed main:** `8e8f319724ba1948b2890c3818c194ae646c6777`  
**Production URL:** <https://timing-calibrator.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Scope:** clean-checkout independent static-web QA against the researched
brief and factory product contract. No product code was changed.

The prior deployment-only concern is not present: fresh SHA-256 comparison of
the local production build and custom-domain responses shows the live product
is exactly this candidate. The core local calibration workflow works through
track analysis, grid confirmation, device measurement, 20-beat proof, and
export; it retains no user audio or measurement data server-side.

## Release identity

- The clean tree started at the candidate SHA. `git ls-remote origin
  refs/heads/main` returned the same SHA.
- These local production artifacts and live responses had identical SHA-256
  digests:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `5fb4fe808e09d52c162b98c398df9cf9547602fd4530bacc19b02bed31a85ea2` |
| `assets/index-DMEMo1V5.js` | `8bd6f337fa49af6101629579f8148be88be658adcfc561e4c861c20a0147d613` |
| `assets/index-BgRy3yET.css` | `4cfa0fb274d475eefa00b43e0733a605d7ae11e94d84b6d469884f9b824bbcb5` |
| `assets/pulse-bench-768.webp` | `00211bd79b92ce6f55b0abcf6625ee3a21b8287505b84fc37fab6f6145899888` |
| `assets/pulse-bench-1536.webp` | `5aa92ed31fe3dcc0d70c23b4d142f5e8feee5a55332275eba1946cf927a1af1e` |
| `sw.js` | `45f50cbecb9bd36e57453ed952aefda878954a587fcdf951dd303743ccd8a89c` |
| `privacy/index.html` | `98b95f1d3a8222c7b5b8a60cfa58e2a171516c3866f176b56a6b0cc047af709e` |
| `terms/index.html` | `0af1583cf543465bca46abb9ea6db1b7d2dfbd3081b671cfa1cb0487df4a9f46` |

## Repository gates

| Check | Result | Evidence |
| --- | --- | --- |
| Clean install | PASS | `npm ci`: 58 packages; 59 audited |
| Dependency audit | PASS | `npm audit --audit-level=low`: 0 vulnerabilities |
| Unit tests | PASS | `npm test`: 5/5 Vitest tests |
| Type check / production build | PASS | `npm run build`: `tsc --noEmit` and Vite 7.3.6 succeeded |
| Browser integration | PASS | All 16 Playwright tests passed on desktop Chromium and 390 × 844 mobile (two timing-heavy cases plus the remaining 12-test selector) |
| Lint | N/A | No lint script or lint configuration exists |

The built initial JS is 15,612 bytes (6.28 KB gzip); CSS is 10,902 bytes
(3.30 KB gzip); mobile hero is 10,688 bytes; no web fonts load. All are within
the static-product budgets.

## Independent functional QA

- Imported a freshly generated 8-second WAV click track. It decoded locally,
  found 15 onsets, and estimated 120.2 BPM. A corrupt WAV showed the documented
  decode error; choosing the clean sample then recovered normally.
- The native numeric constraints rejected BPM 29.9 and 300.1 and a negative
  anchor without changing the accepted grid. An explicit zero anchor was
  accepted. A 50 MiB + 1 byte file was rejected with the documented size error.
- Manual device offsets −1001, 1001, and blank were rejected; −1000, 1000,
  and deliberate zero were accepted and represented with the correct sign.
- On production at 390 px, a keyboard-only run used alternating Space and
  Enter for all 12 pulses (`12 / 12`). It then completed the 20-beat proof:
  median absolute residual 14.8 ms, p90 15.11 ms, 20/20 within 20 ms, and
  `target_met: true`; no console or page errors occurred.
- A confirmed source plus confirmed 25 ms manual device estimate was edited
  from 120.2 to 130 BPM. Device and verification results hid, both downstream
  starts disabled, the preview emptied, and a forced export was blocked with
  “Complete and confirm all three passes before exporting.” This independently
  verifies the previous release-blocking invalidation repair.
- Godot, Unity, generic JSON, download, clipboard error recovery, invalid
  inputs, legal pages, and offline behaviour are covered by the passing
  repository tests. This static product has no library/CLI, backend endpoint,
  sign-in, payment, or product-unlock API; rate-limiting and Entra checks do
  not apply.

## Accessibility, responsive, and visual checks

- Fresh live Axe WCAG 2 A/AA scans on desktop and 390 × 844 mobile had zero
  serious or critical violations. Repository Axe coverage also passed in both
  projects.
- `/opt/fleet/lib/verify-url.sh` passed: HTTPS 200, 792 ms load, title,
  `lang="en"`, one `h1`, main landmark, image alt text, and no console/page
  errors. Its raw `innerText` heuristic counted one hidden control as unlabeled;
  it is not exposed, and Axe found no accessible-name violation.
- The first Tab stop is the visible “Skip to calibration” link, with a
  designed 3 px `#B42318` focus outline. No keyboard trap was found. Footer
  links meet 44 × 44 px in both Playwright projects.
- Desktop and 390 px full-page visual review found no clipping, overlap, or
  horizontal overflow. The mobile layout stacks the workflow intentionally.
- Under reduced-motion emulation, scroll behaviour was `auto`, animation and
  transition durations were 0.01 ms, and pulse transform was `none`.

## Privacy, policies, caching, and performance

- A clean desktop and mobile live context requested only
  `https://timing-calibrator.sociobot.in`; it created no cookies and left
  localStorage and sessionStorage empty. Source inspection and runtime checks
  found no analytics, third-party scripts/fonts, microphone request, audio
  upload, or external API call. The GitHub Source link is user-initiated only.
- Live responses have a self-only CSP, HSTS, strict-origin referrer policy,
  `nosniff`, and a Permissions Policy denying camera, microphone, and
  geolocation. HTML caches for 30 seconds; hashed assets cache immutable for
  one year; `sw.js` is `no-cache`.
- The PWA service worker controlled the live page. After seeding a
  `pulse-check-v2` cache and reinstalling, only `pulse-check-v3` remained.
  An offline reload rendered the complete shell and visible offline notice.
- Fresh Lighthouse 13.4.1 live mobile: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 0.3 s, LCP 0.3 s, TBT 0 ms, CLS 0, Speed
  Index 0.3 s (provided throttling).

## Defects by severity

None found.

## Known validation limit

The brief’s outcome metric requires a pilot team to repeat the test on two
physical target devices. Browser automation proves the workflow and a
simulated target-met result, but cannot substitute for physical loopback or a
two-device field pilot. The product discloses that limitation before export.
