# Review: separate source drift from device latency

## Verdict: FAIL

Implementation reviewed: fc4902c35bfbc5c0874bfcfc581aae3456b527e7  
Documentation SHA: 608a5e3d071a1ccf73ffb101935af7f25e557427  
Live URL: https://timing-calibrator.sociobot.in/  
Reviewed: 2026-09-06 UTC  
Findings: 6 (3 P1, 3 P2)  
Untested public claims: 12

The live HTML and hashed assets match a fresh production build of the checked-out
head. The only commits after the implementation SHA update review documentation,
so fc4902c is the implementation candidate. This release cannot pass: it has
no isolated one-click demo, its claimed clean 120 BPM sample diagnoses source
drift, and it has no claim manifest or claim-level test commands.

## First screen

Before scrolling, I recorded the same state in fresh desktop (1440 x 1000) and
phone (390 x 664) browsers.

- Job: separate source-track beat-grid drift from target-device playback latency,
  then export an engine offset.
- Audience: rhythm-game makers and mobile music-app builders testing player
  devices.
- First action shown: Begin calibration. It only scrolls to the form; it does
  not start a sample or real calibration.
- Visible headline: “Find where the beat went.” This does not name the job in
  plain words.
- The first screen has no Try it with sample data action, no sample explanation
  next to an action, and one privacy fact rather than the required three plain
  facts.

## Findings

### P1 — no isolated, one-click demo

The demo-sandbox contract is absent. Fresh desktop and phone contexts loaded
/demo and /?demo=1; both returned the ordinary landing page with “No track
loaded yet.” The only sample control is below the first screen and is named Use
a clean 120 BPM sample. After using it, populated analysis appeared, but there
was no persistent “Demo — sample data, nothing is saved” label, Reset demo, or
Start for real control. No separate demo: storage namespace exists. Local and
session storage remained empty, which is safe but is not the required sandbox.

A visitor cannot try the product in one click or tell that the sample is
isolated. Add a direct demo entry that loads the realistic sample, marks the
state persistently, offers reset and start-for-real actions, and uses a
separate storage namespace. Document it in .factory/demo.md.

### P1 — the claimed clean 120 BPM sample reports source drift

On the live page, select Use a clean 120 BPM sample. The result reports 15
onsets, 120.2 BPM, “Possible source drift,” and “Onsets move about 42.3 ms per
minute … Correct the BPM or anchor before blaming playback.” Change Tempo to
the sample's stated 120 BPM and select Recheck grid. The result becomes 57.7
ms/min drift and remains “Possible source drift.” Only 120.1 BPM clears the
drift diagnosis.

The bundled source is generated at exactly half-second intervals. The first
onset is detected at 488 ms and frame quantization makes the proposed 120.2 BPM
disagree with the steady-grid threshold. A user following the sample is told to
suspect a drifting source before measuring device latency. Make the generated
sample and analysis agree, or label it as a deliberately drifting sample and
ship a separate steady sample. Add a regression proving the steady sample
begins with a steady diagnosis at its displayed BPM.

### P1 — public claims have no required claim manifest or tests

.factory/claims.json does not exist. There are no declared claim commands to
run and no @claim:id tests. The passing general Playwright suite does not meet
the one-test-per-claim rule.

The following 12 public claim groups are untested under that contract:

1. separates track drift from playback latency;
2. analyzes local audio onsets;
3. measures a target device with the tap/click path;
4. verifies 20 corrected beats;
5. exports Godot, Unity, and generic JSON offsets;
6. accepts the named audio formats up to 50 MB;
7. runs entirely in the browser and does not upload audio;
8. needs no account, API key, microphone, or server;
9. works after the first load without a network connection;
10. uses only the offline application cache as browser persistence;
11. uses no cookies, ads, analytics, or third-party runtime services; and
12. is free.

Create the manifest, remove any claim that cannot be proven, and add exactly
one clean-demo observable test for each remaining claim.

### P2 — landing copy does not meet the plain-words contract

The primary headline is a metaphor, not the job. The main call to action is a
generic scroll action and does not say what happens next. The required
.factory/copy-audit.md is also absent. Rewrite the first screen around the real
task and sample action, for example “Separate track drift from device delay,”
followed by the named audience and Try it with sample data.

### P2 — required site metadata and shared navigation are incomplete

The landing HTML has no canonical URL, Open Graph fields, Twitter card,
apple-touch icon, or product-derived social image. The landing header has a
wordmark but no navigation. Privacy and Terms use a separate minimal header and
footer rather than the required shared header, navigation, footer links, Param
Factory credit, and build identifier. The sitemap cannot list a usable demo
route because none exists.

### P2 — unknown URLs render the landing page instead of a designed 404

Both /404 and /not-a-real-page return HTTP 200 with the normal landing title
and headline. There is no actual 404 page with a route-specific title, plain
explanation, or way back. Configure a real 404.html without routing arbitrary
missing pages to the application shell.

## Current disposition of earlier findings

| Earlier finding | Current disposition and evidence |
| --- | --- |
| Verification 2 P1: blank manual offset became 0 ms | Fixed. Live blank, -1001, and 1001 offsets each showed the validation error and created no device result. Explicit -1000 was accepted. |
| Verification 2 P2: blank anchor became zero | Fixed. After accepting 125 ms, a blank recheck displayed the validation error and retained the accepted source summary. |
| Verification 3 P1: grid edit exported stale results | Fixed. After completing source, manual device, and verification passes, changing BPM to 130 hid device and verification results, disabled both downstream starts, and emptied the export preview. |
| Verification 3 P2: footer targets under 44 px | Fixed. Live desktop measurements: Privacy 60 x 44, Terms 52 x 44, Source 59 x 44 CSS px. |
| Verification 4: no findings | Superseded. Its regression fixes remain present, but this review found unsatisfied demo, sample-diagnosis, claims, copy, metadata, and 404 contracts. |

## Checks that passed

| Check | Result |
| --- | --- |
| Clean dependency install | PASS — npm ci; 59 packages audited |
| Dependency audit | PASS — npm audit --audit-level=low; 0 vulnerabilities |
| Unit tests | PASS — npm test; 5/5 |
| Type check and build | PASS — npm run build; dist/ produced |
| Browser suite | PASS — npm run test:e2e; 16/16 in 56.5 s |
| Live desktop and phone smoke | PASS for the existing core flow — sample analysis populated 15 onsets and visible metrics without errors or overflow |
| Invalid, boundary, recovery paths | PASS — blank/out-of-range manual input rejected; explicit -1000 accepted; blank anchor retained prior valid grid |
| Keyboard and motion | PASS — fresh 390 px reduced-motion session used alternating Space/Enter for all 12 visual pulses; count reached 12 and produced a device estimate; pulse transform was none and transitions were 0.01 ms |
| Accessibility | PASS — verify-url.sh found title, lang, one h1, main, alt text, and no console errors. Live Playwright Axe WCAG 2 A/AA scans had zero violations on desktop and phone. The standalone Axe CLI was attempted but cannot locate a system Chrome binary in this worker; the attached Playwright Axe integration is the allowed equivalent. |
| Privacy | PASS for observed behavior — fresh live sample flow requested only the product origin; no cookies, localStorage, sessionStorage, microphone request, analytics, upload, or third-party runtime request appeared |
| Offline reload | PASS — fresh live service-worker context controlled the page with pulse-check-v3; an offline reload rendered the shell and visible offline notice |
| Legal and external links | PASS — Privacy and Terms returned 200 with route titles; Source returned 200 |
| Performance budget | PASS by build output — initial JS 6.28 KB gzip and CSS 3.30 KB gzip; no downloaded fonts |

No backend, tenant isolation, restart persistence, health endpoint, or 429 check
applies: this is a static local-first web product with no backend.

## Recommendation

Do not approve this implementation. Resolve all six findings, add the missing
claim and demo evidence, deploy the repaired bytes, and repeat this review.
