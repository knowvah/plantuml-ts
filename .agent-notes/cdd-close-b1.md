# cdd-close-b1 — batch 1 close (class-divergence-drive)

Written 2026-09-21. Survey 412/50/261 → 431/66/226; census 414 → 433;
ratchet 314 → 433 pins; DOT 710/711.

## Observation: the class ratchet was ~100 pins behind its own criterion
- **Finding**: 119 fixtures were survey-conformant AND census-0-diff AND
  dotEqual before the re-pin; only 19 of them were moved by this batch. The
  other 100 had qualified in earlier missions and were never pinned. The
  exit bar ("every survey-conformant AND census-0-diff fixture is pinned")
  is therefore a real gate, not a formality — check the candidate count at
  every close, not just the batch's movers.
- **Confidence**: High (`<scratch>/pinned-b1.txt`, 119 slugs).

## Observation: the census column of the dashboard reads a committed JSON
- **Finding**: `docs/parity-report.md`'s census count comes from
  `tests/oracle/svg-conformance/census-class.json`, which the census only
  writes with `--json <path>`; every close.md omits it, so the column goes
  stale while pins rise past it. Regenerate it with
  `npx jiti scripts/svg-conformance-census.ts class --json tests/oracle/svg-conformance/census-class.json`
  at every close and commit it alongside `parity-class.json`.
- **Confidence**: High.

## Observation: 14 `B1 B2` rows stop at structural-match on GEO5
- **Finding**: every ORD1 fixture that also carries GEO5 went
  diverged → structural-match, not conformant; batch 2 (B2) owns the
  remainder. Their `after batch 1` cell says `structural-match` by design.
