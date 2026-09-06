# Pulse Check — verification 5 handoff

## Outcome

FAIL. Implementation `47c8bbf9c6feda9fd0c92af28bdc32bdc79bde35` matches the
live deployment and passes functional, accessibility, offline, privacy,
performance, and all 14 declared-claim checks. Two P2 findings and two untested
public claims block acceptance.

Documentation baseline: `2f4b14f22735343a9d024a1c357db9c7d63f20e1`.
No product code was changed.

## Findings to repair

1. Add claim entries and tagged outcome tests for **Copy JSON** and the README
   promise of no advertising, analytics, or microphone access, or remove those
   promises.
2. Identify the GitHub footer link as external on `/privacy/`, `/terms/`,
   and the designed 404 page.

After repair, rerun every claim command and the full desktop/mobile suite.

## Verification completed

- Fresh install, 6 unit tests, build, all 32 E2E checks, all 14 claim commands,
  and audit passed.
- Live desktop and phone runs covered the first screen, demo isolation, full
  calibration, invalid and boundary values, recovery, keyboard, focus, 200%
  text, reduced motion, routes, legal pages, 404, privacy, and offline/update.
- Live Axe found zero violations; the URL verifier found no console errors.
- Lighthouse scored 100 in all categories. FCP/LCP were 0.9 s, TBT 0 ms, CLS 0.
- Local and live production hashes matched.

Full report: `.factory/verification-5.md`.

## Known limit

A physical loopback and two-device pilot remain necessary for the real-device
under-20 ms result. The product discloses this limit.
