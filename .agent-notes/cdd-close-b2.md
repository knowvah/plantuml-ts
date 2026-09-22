# cdd-close-b2 — batch 2 close (class-divergence-drive)

Written 2026-09-21. Survey 431/66/226 → 455/55/213; census 433 → 457;
ratchet 433 → 457; DOT 711/712.

## Observation: every new golden dir needs two baseline rows and four count edits
- **Finding**: `routing-conformance.test.ts` and `refusal-coverage.test.ts`
  key golden dirs as `goldens:svg-class/<slug>` and pin hard-coded totals.
  Each class re-pin therefore also appends N cloned rows to BOTH
  `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`
  (`tree: goldens`, `type: svg-class`, fields identical to the dot-cache
  twin) and bumps four `toBe` counts with a derivation comment. The script
  in journal rows 23/32 is the procedure; `pin-corpus-tree.ts` cannot do it
  (it hardcodes `tree: 'dot-cache'`).
- **Confidence**: High (two closes).

## Observation: a red whole-corpus gate under load is not a signal
- **Finding**: three `npm test` runs this batch were red only with
  `Test timed out` and a degraded collected count (744/758) at 1-min loads
  of 24-133; `mediaanalysisd` was at 100% of a core for 3 days. The same
  tree passed quietly. Read `uptime` and the JSON reporter's collected
  count before diagnosing a red gate.
- **Confidence**: High.
