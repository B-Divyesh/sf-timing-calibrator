# Pulse Check — repair 3 handoff

## Outcome

Release-blocking findings from verifier report commit
`921c0a993423f5bf405dadda79639fe68f648595` against candidate
`723dfac5f830c120f39afec9140b95c8dad1c993` are repaired and deployed.

- Repair commit: `fc4902c35bfbc5c0874bfcfc581aae3456b527e7`
- Production: <https://timing-calibrator.sociobot.in/>
- Azure Static Web App: `sf-timing-calibrator` (`eastus2`)
- Deployment ID: `c23bf231-c144-4632-9e4b-4977fac649c7`
- Artifact remains a Vite + TypeScript static web app with `dist/index.html` at
  its root.

## Repairs

### P1 — stale downstream calibration after a source edit

Source replacement and accepted BPM/anchor edits now invalidate the complete
dependency chain. In-progress timers stop, source confirmation is cleared,
device and verification objects/results are removed, downstream controls are
disabled, the export preview is emptied, and the user is told to confirm and
measure again. A source-revision token also prevents a slower, superseded audio
decode/analysis from restoring stale state.

Export and clipboard actions now independently require a confirmed source,
confirmed device, and fresh verification. Replacing a device estimate also
invalidates its old verification. This protects the data boundary even if a
hidden export control is invoked programmatically.

The new Playwright regression completes and downloads a 120.2 BPM / 25 ms /
20-sample calibration, changes BPM to 130, proves every dependent result and
control is invalidated and a forced download is blocked, then redoes the device
and proof passes and confirms the new download contains BPM 130 and the fresh
30 ms measurement. It runs on desktop Chromium and 390 × 844 mobile.

### P2 — footer touch targets

Privacy, Terms, and Source are now inline-flex targets with a 44 px minimum
height and width. Measured desktop and mobile boxes are respectively
`60.45 × 44`, `51.56 × 44`, and `58.70 × 44` CSS px. A browser regression
asserts both dimensions for all three links in both projects.

### Offline update

The application-shell cache is versioned as `pulse-check-v3`. Activation was
tested with a seeded v2 cache; v2 was removed and only v3 remained.

## Verification evidence

Final clean dependency and repository gates:

```sh
npm ci
npm audit --audit-level=low
npm test
npm run build
npm run test:e2e
```

- Install/audit: 59 packages audited, 0 vulnerabilities.
- Unit: 5/5 Vitest tests passed.
- Type/build: `tsc --noEmit` passed; Vite 7.3.6 produced `dist/`.
- Browser integration: 16/16 passed in 59.1 s across desktop Chromium and
  390 × 844 mobile.
- No lint command/configuration exists; strict TypeScript validation is the
  applicable static check. Package/consumer and backend tests do not apply to
  this static application.
- Final initial assets: JS 15,612 bytes (6.28 KB gzip), CSS 10,902 bytes
  (3.30 KB gzip), mobile hero 10,688 bytes; all remain well below budget.

Additional final-build probes covered a generated real WAV import at 120.2
BPM; corrupt, 50 MiB + 1 byte, and low-onset failures with recovery; BPM 30/300
acceptance and 29.9/300.1/blank rejection; anchor negative/blank rejection;
manual offset −1000/1000/explicit-zero acceptance and out-of-range/blank
rejection; Godot, Unity, and generic signed exports; download and clipboard.

Keyboard and responsive checks passed: the skip link is the first visible Tab
target; alternating Space and Enter completed all 12 pulses at 390 px; desktop
and mobile had zero horizontal overflow or console errors. Axe WCAG 2 A/AA had
zero serious/critical findings on local and live desktop/mobile runs. The
factory URL verifier passed title, English language, one h1, main landmark,
image alt, and console checks. Its raw hidden-button heuristic reports the
button inside the collapsed manual-entry disclosure; the exposed button has a
visible accessible name and Axe reports no violation.

Privacy checks observed same-origin requests only, zero cookies, empty local
and session storage, no uploads, analytics, third-party scripts/fonts, or
permission requests. Live response policy includes self-only CSP, HSTS,
strict-origin referrer policy, `nosniff`, and camera/microphone/geolocation
denial. HTML revalidates after 30 seconds, hashed assets are immutable for one
year, and `sw.js` is `no-cache`. Offline shell reload and the v2 → v3 cleanup
path both passed.

Fresh live Lighthouse 12.8.2 mobile results: Performance 100, Accessibility
100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 0.9 s, TBT 0 ms, CLS 0, Speed
Index 0.9 s.

## Live identity

Local production and custom-domain bytes match exactly:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `5fb4fe808e09d52c162b98c398df9cf9547602fd4530bacc19b02bed31a85ea2` |
| `assets/index-DMEMo1V5.js` | `8bd6f337fa49af6101629579f8148be88be658adcfc561e4c861c20a0147d613` |
| `assets/index-BgRy3yET.css` | `4cfa0fb274d475eefa00b43e0733a605d7ae11e94d84b6d469884f9b824bbcb5` |
| `sw.js` | `45f50cbecb9bd36e57453ed952aefda878954a587fcdf951dd303743ccd8a89c` |

The live repaired flow independently downloaded BPM 120.2, offset 25 ms, and
20 verification samples; after changing BPM to 130 it hid both stale result
panels, disabled device and verification starts, emptied preview, and rejected
a forced export.

## Known limits

- Browser timing combines output, display/touch sampling, scheduling, and
  human response; release-critical offsets still need physical loopback.
- Lightweight onset detection is best for percussive material and needs manual
  correction for dense, rubato, or tempo-changing tracks.
- The brief's two-device physical pilot cannot be completed in this browser-only
  worker; it remains field validation, not a software release blocker.
- Audio and calibration data remain memory-only; only the versioned offline
  shell is persisted.
