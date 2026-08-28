# Pulse Check — independent verification 3

## Verdict: FAIL

**Candidate:** `723dfac5f830c120f39afec9140b95c8dad1c993`  
**Production URL:** <https://timing-calibrator.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Scope:** clean-checkout static-web QA against the researched brief and factory
product contract. No product code was changed.

The candidate fixes the two blank-number failures in the preceding report and
the deployed bytes match the candidate. It does not pass because editing an
accepted source grid after a completed calibration leaves the old device and
verification results active. The displayed preview remains stale while a new
download silently combines the unconfirmed source grid with the old downstream
measurements. That can produce an internally inconsistent engine offset file in
the product's core workflow.

## Release identity and deployment

- The working tree began clean at the requested SHA. `git rev-parse HEAD` and
  `git ls-remote origin refs/heads/main` both returned
  `723dfac5f830c120f39afec9140b95c8dad1c993`.
- The fresh local production build and custom-domain responses matched exactly:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `9d00e7aef79f97da1913b4f5993df8b3c75d16b7520c2f505f74cf04025c1170` |
| `assets/index-UjN2sFTo.js` | `441addfa0d8188b315224a32dd7faa343dcf70679788953e7a7785d2212dfe7c` |
| `assets/index-D_StEOii.css` | `95396942bb452952aa120917ea32fc0a2fa7d3bd3d2e4ef403ff9189e061259b` |
| `sw.js` | `fb773f8ae5db70caa46cf27595a7ec171287126798d8a565ef9f3f922b8c1d75` |
| `assets/pulse-bench-768.webp` | `00211bd79b92ce6f55b0abcf6625ee3a21b8287505b84fc37fab6f6145899888` |

- Live HTML names the same hashed JS and CSS as the local build. This is a
  production match even though this candidate changes only tests and handoff
  text relative to the deployed repair code.

## Repository quality gates

| Check | Result | Fresh evidence |
| --- | --- | --- |
| Install | PASS | `npm ci`: 58 packages added, 59 audited, 0 vulnerabilities |
| Audit | PASS | `npm audit --audit-level=low`: 0 vulnerabilities |
| Unit tests | PASS | `npm test`: 5/5 Vitest tests |
| Type check | PASS | `tsc --noEmit` completed inside `npm run build` |
| Production build | PASS | Vite 7.3.6 built `dist/` successfully |
| Repository E2E | PASS | `npm run test:e2e`: 12/12 in 36.4 s, Chromium desktop and 390 × 844 mobile |
| Lint | N/A | No lint script or lint configuration exists |

Production output is 14,170 bytes JS (5.91 KB gzip), 10,780 bytes CSS
(3.29 KB gzip), 10,688 bytes for the mobile hero, and 74,678 bytes for the
desktop hero. Initial JS, CSS, image, and font budgets pass; there are no web
fonts. The source map is not loaded by the page.

## Independent functional coverage

- Imported an actual generated WAV click track and obtained an approximately
  120 BPM onset analysis, then recovered successfully after each error case.
- Exercised BPM boundaries 30 and 300, rejected 29.9, 300.1, and blank; rejected
  a negative anchor and confirmed that a blank anchor preserves the last
  accepted grid. Native number validity provides the out-of-range message;
  the app's live status handles blank values.
- Rejected an undecodable file, a 50 MiB + 1 byte file, and audio with fewer
  than four clear onsets. The built-in sample remained usable after each error.
- Rejected manual offsets `-1001`, `1001`, and blank; accepted the inclusive
  `-1000` and `1000` boundaries and an intentional zero.
- Completed sample → source confirmation → manual device measurement → 20-beat
  verification. Godot, Unity, and generic JSON contained the expected signed
  corrections. Download naming and clipboard copy succeeded.
- On live 390 px mobile, completed all 12 device pulses using alternating Space
  and Enter. The counter reached `12 / 12` and produced a device result.
- No console or uncaught page errors occurred in normal, invalid-file,
  boundary, keyboard, local, or live runs.
- A physical two-device pilot was not available in the container, so the
  brief's real-device outcome metric remains a field validation task rather
  than a browser-QA claim.

## Accessibility and responsive checks

- Repository Axe checks and independent live Axe WCAG 2 A/AA scans found zero
  serious or critical violations on desktop and 390 × 844 mobile.
- `/opt/fleet/lib/verify-url.sh` returned success: load 819 ms, no console/page
  errors, title present, `lang="en"`, one `h1`, a `main`, and no image missing
  alt text. Its raw unlabeled-button heuristic counted the collapsed manual
  action because `innerText` is empty inside a closed `details`; the button has
  visible text when exposed and Axe reports no naming violation.
- The skip link is the first Tab stop and becomes visible with a 3 px focus
  outline. Controls were keyboard operable and no trap was found.
- Reduced-motion emulation reduced transition duration to 0.01 ms and removed
  pulse scaling. Neither desktop nor 390 px mobile had horizontal overflow.
- Desktop and mobile full-page visual review found legible hierarchy, stable
  responsive stacking, and no overlapping or clipped content.
- The three footer links have 24 px-high hit boxes. This misses the explicit
  44 × 44 px product-contract target even though spacing is adequate and Axe
  reports no serious issue; see P2.

## Privacy, network, policies, caching, and offline behavior

- A fresh live context made requests only to
  `https://timing-calibrator.sociobot.in`. It created no cookies and left both
  `localStorage` and `sessionStorage` empty. There are no third-party runtime
  scripts, fonts, analytics, microphone requests, or uploads.
- Live responses include self-only CSP directives, HSTS
  (`max-age=10886400; includeSubDomains; preload`),
  `Referrer-Policy: strict-origin-when-cross-origin`, `nosniff`, and a
  Permissions Policy denying camera, microphone, and geolocation.
- HTML is `public, must-revalidate, max-age=30`; hashed JS/CSS and images are
  `public, max-age=31536000, immutable`; `sw.js` is `no-cache`.
- A clean service-worker install controlled the page and created
  `pulse-check-v2`. A seeded `pulse-check-v1` cache was deleted during
  activation, proving the update cleanup path. An offline reload then rendered
  the complete shell and visible offline status.

## Performance

Fresh Lighthouse 12.8.2 against the live mobile URL:

| Category/metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0.9 s |
| LCP | 0.9 s |
| TBT | 10 ms |
| CLS | 0 |
| Speed Index | 0.9 s |
| Initial transfer | 24 KiB |

## Defects

### P1 — changing the source grid leaves and exports stale downstream results

Live reproduction:

1. Analyze the clean sample, confirm the source grid, apply and confirm a
   `25 ms` manual device offset, and finish the 20-beat verification.
2. Note that the export preview records source BPM `120.2`.
3. Change BPM to `130` and choose **Recheck grid**. The app correctly says the
   new grid must be reviewed and confirmed.
4. Observe that **Start 12-pulse test** and **Start 20-beat verification** are
   still enabled, both old result panels remain visible, and the preview still
   says `120.2`.
5. Choose **Export calibration JSON**. The downloaded file says BPM `130` but
   retains the prior device and verification objects, including the prior
   `target_met` result.

The grid submit handler only sets `source.confirmed = false` and rerenders the
source. It does not clear or disable device, verification, or export state.
`exportPayload()` then reads the new live source together with the stale device
and verification objects. The preview and downloaded file can therefore
disagree, and unconfirmed source data can be shipped as if it passed the old
proof. This directly undermines the core calibration export and is
release-blocking.

Expected repair: whenever imported audio, BPM, or anchor changes, invalidate
and hide all dependent device/verification/export state, disable downstream
actions, and require confirmation and a fresh proof before any export. Add a
regression that asserts both visible state and downloaded payload.

### P2 — footer links miss the 44 px touch-target contract

On both desktop and 390 px mobile, measured hit boxes were `52 × 24` px for
Privacy, `44 × 24` px for Terms, and `51 × 24` px for Source. Increase their
block/padding hit area to at least 44 px high while preserving visible focus.

## Recommendation

Do not approve candidate `723dfac5f830c120f39afec9140b95c8dad1c993`.
Repair the source-to-downstream invalidation cascade and add its end-to-end
regression, then address the footer hit areas and repeat verification against a
fresh deployment.
