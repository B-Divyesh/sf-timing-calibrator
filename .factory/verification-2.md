# Pulse Check — independent verification 2

## Verdict: FAIL

**Candidate:** `f3020b5050be06158a7309f4cd8184dc31c45b2d`  
**Production URL:** <https://timing-calibrator.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Scope:** clean-install static-web QA against the researched brief and product contract. No product code was changed.

The release is deployed and otherwise performs well, but it must not pass while
an absent manual measurement can be accepted, confirmed, and exported as a
real `0 ms` device offset. That can directly produce a wrong engine timing
correction on the accessibility alternative required by the brief.

## Release identity and deployment

- Clean checkout started at the candidate SHA; `git ls-remote origin main`
  returned the same SHA.
- Fresh `npm ci` completed with 0 audit vulnerabilities.
- Built asset integrity is exact: SHA-256 of the local `dist/index.html`,
  `assets/index-B9qrsdlC.js`, and `assets/index-D_StEOii.css` respectively
  matched the three live responses:
  `1518d55bf1c4e960c3dc8f6d13dd1a689b4d729b6b273fcfb36ea2d04c6235e6`,
  `3b118c98f600deb537f162ec26cf82f8503a73ea6c530cefe8c0e9f8f9cb3dbc`, and
  `95396942bb452952aa120917ea32fc0a2fa7d3bd3d2e4ef403ff9189e061259b`.
- Live HTML refers to exactly the same JS, CSS, and two image filenames as
  the candidate build.

## Checks run

| Check | Result | Evidence |
| --- | --- | --- |
| Clean install | PASS | `npm ci`; 59 packages audited, 0 vulnerabilities |
| Unit tests | PASS | `npm test`: 5/5 Vitest tests |
| Type check and production build | PASS | `npm run build`: `tsc --noEmit` and Vite 7.3.6; `dist/` produced |
| Repository E2E suite | PASS | `npm run test:e2e`: 8/8 in Playwright 1.58.2, desktop + 390x844 mobile |
| Lint | N/A | No lint script/configuration is provided; TypeScript check is part of build |
| Desktop/mobile product smoke | PASS except defects below | Sample analysis, grid confirmation, manual route, 12-pulse keyboard route, 20-beat verification, Godot/Unity/generic export, 390px no horizontal overflow |
| Error/recovery paths | PARTIAL | Undecodable file and >50 MiB file show recovery errors; out-of-range manual offset rejects then accepts `-1000`; empty manual offset defect below |
| Keyboard/focus/reduced motion | PASS | Skip link is first tab stop with a visible 3px `#b42318` ring; Space/Enter completed the 12/20 pulse runs; 390px reduced-motion run completed |
| Axe WCAG 2 A/AA | PASS | Live desktop and 390px mobile: 0 total, 0 serious/critical violations |
| Console/page errors | PASS | None in normal, invalid-file, keyboard, or live-load runs |
| Offline/PWA | PASS for offline reload | After service-worker control/reload, offline reload showed the shell and offline note in both E2E projects. Live registration controls the page and cache `pulse-check-v1` is present. `sw.js` is served `no-cache` and contains `skipWaiting()`/`clients.claim()` for activation. A changed-deployment update cannot be empirically exercised without a second deployment. |
| Privacy/outbound requests | PASS | Runtime requests stayed same-origin; no cookies, localStorage, or sessionStorage; no third-party font/script; CSP restricts connections to self; no microphone permission in policy |
| Headers/cache | PASS | Live HTTPS supplies CSP, HSTS, Referrer-Policy, `nosniff`, and camera/microphone/geolocation-denying Permissions-Policy. Hashed JS/CSS are `max-age=31536000, immutable`; `sw.js` is `no-cache`; HTML is `max-age=30, must-revalidate`. |
| Bundle budget | PASS | Initial JS 14,128 bytes / 5.88 KB gzip; CSS 10,780 bytes / 3.29 KB gzip; largest image 74,678 bytes — each below the stated limits |
| Lighthouse live mobile | PASS | Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0s, LCP 1.0s, TBT 30ms, CLS 0 |

The first direct E2E invocation encountered `ERR_CONNECTION_REFUSED` after a
short-lived preview process was no longer listening. Re-running the exact
suite with an explicitly held `vite preview` server produced the 8/8 PASS
result above; no product assertion failed.

## Defects

### P1 — empty manual output offset becomes a valid 0 ms measurement

1. Load the clean 120 BPM sample and confirm its grid.
2. Open **Use a known offset instead of tapping**.
3. Leave **Known output offset (ms)** empty and choose **Use known offset**.
4. The application reports “Device estimate ready”, displays `+0.0 ms`,
   enables confirmation, and will export that value as a manual device
   measurement.

`Number(input.value)` converts `""` to `0`, so the finite/range validation in
`src/main.ts` does not reject an absent measurement. The brief specifically
requires the accessible manual alternative; accepting an invented zero can
cause incorrect Godot/Unity offsets and invalidates the real job-to-be-done.
Require a non-empty value before numeric conversion and announce the error.

### P2 — clearing the first-beat anchor silently changes it to zero

After sample analysis, clear **First beat anchor (ms)** and submit **Recheck
grid**. The page accepts it and says “Grid updated”, because `Number("")` is
also zero. Zero is a legitimate explicit value, but a cleared field should be
invalid rather than silently changing the source diagnosis. Require a value
before parsing (or restore the last valid anchor) and give a live error.

## Handoff recommendation

Fix both empty-number validation paths, add regression tests for blank manual
offset and blank anchor, then repeat the production build and E2E checks. Do
not approve this candidate until the P1 is resolved.
