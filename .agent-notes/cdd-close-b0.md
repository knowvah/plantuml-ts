# cdd-close-b0 — batch 0 close (class-divergence-drive)

Written 2026-09-21. The pipeline every later close reuses, as it actually
runs (the brief's commands need two corrections, both journaled):

```sh
npm run svg:survey -- class --out tests/oracle/svg-conformance/parity-class.json   # ~16 s
npx jiti scripts/svg-conformance-census.ts class | grep -A6 DeterministicMeasurer   # 2nd block is the metric
npx jiti plans/class-divergence-drive/tools/render-all.mts plans/class-divergence-drive/measurements/bN.json   # ~9 s
npx jiti plans/class-divergence-drive/tools/pin-diff.mts measurements/b<N-1>.json measurements/bN.json
npm run parity:dashboard
npm test -- --reporter=default --reporter=json --outputFile=<scratch>/vitest.json   # collected = testResults.length
```

## Observation: a zero-change batch is a clean fixed point
- **Finding**: with no `src/` change, `render-all` output is byte-identical
  across runs (`cmp base.json b0.json`), so any non-empty `pin-diff` at a
  later close is a real mover, never tool noise. `render-all` renders
  in-process (no worker timeout); `dot-engine` prints `lost A B edge` and
  `triangulation failed` warnings to the console on a few fixtures — noise,
  pre-existing, not a verdict.
- **Confidence**: High.

## Observation: `parity-class.json` and `docs/parity-report.md` move on every close
- **Finding**: a fresh survey rewrites `generatedAt`, and the dashboard's
  two freshness lines follow it. Neither is in a close's literal write-set;
  close.md step 7 authorises committing the timestamp-only diff. Diff both
  before staging and commit only if nothing else moved.
- **Confidence**: High.
