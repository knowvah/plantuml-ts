# lor-T0 — the floor pin for `linetype-ortho-routing`

Written 2026-09-03, orchestrator, against `76312623` (clean tree, all four
gates green). **No `src/` changed.** Pin lives in
`oracle/goldens/svg-conformance/splines-baseline.json`.

## Observation: every one of the 8 jar DOTs carries splines; ours carries none

- **Context**: pinning the pre-change state of the 8 fixtures whose cached
  jar svek DOT emits `splines=`, before wiring the routing half.
- **Finding**: across all 11 cached jar DOTs (8 fixtures; the 2 state ones
  dump `svek-1.dot` + `svek-2.dot`), `splines=` is present on every pass. Our
  own `toSvekDot(DotInputGraph)` emits `splines` on **zero** passes, and
  `DotInputGraph.linetype` does not exist to carry it. That is the defect
  stated in `.agent-notes/gvi17-splines-never-emitted.md`, re-confirmed from
  the emitter side rather than by grep.
- **Impact**: the pin's `oursSplines: null` on every pass is the falsifiable
  before-value. Batch 2 must flip it to `ortho`/`polyline` per fixture.
- **Confidence**: High — measured, not inferred.

## Observation: D4's ortho-only `forcelabels` holds against real jar data

- **Context**: [D4](../plans/linetype-ortho-routing/decisions.md) asserts the
  POLYLINE arm appends only `splines=polyline;` while the ORTHO arm appends
  `forcelabels=true;` too, read from `DotStringFactory.java:162-168`.
- **Finding**: confirmed on data, not just source. All 5 ortho fixtures
  (`bujedi-30-cize673`, `dimisi-54-dula946`, `jakapi-64-tine258`,
  `zosaxo-93-nici652`, `pavuzo-79-zodu430` ×2 passes) carry
  `forcelabels=true;`. All 3 polyline fixtures (`gamevo-26-runo973`,
  `kuxato-79-muno809`, `kejabo-83-vinu490` ×2 passes) carry **none**.
  Zero counter-examples.
- **Impact**: the helper must be a 3-way branch, never a boolean. Uniform
  two-attribute emission would corrupt 3 of the 8.
- **Confidence**: High.

## Observation: a fixture's splines mode is uniform across its passes

- **Context**: the 2 state fixtures each run two layout passes (composite).
- **Finding**: `pavuzo` is ortho on both passes, `kejabo` polyline on both.
  No fixture mixes modes across passes.
- **Impact**: forwarding can read one graph-level value per diagram; no
  per-pass override is needed. (It does NOT license reading it once and
  caching — each assembly site still sets it, per T4's 3 sites.)
- **Confidence**: High for these 8; the corpus at large is unmeasured.

## Observation: the headline number is live and unmoved

- **Context**: `npx jiti scripts/measure-composite-declared-size.ts
  pavuzo-79-zodu430`.
- **Finding**: scope 2 / width / idx 2 = `-1.5799679999999974 px`, matching
  the 2026-08-19 filing to the digit. The tree has not moved under it.
  `kejabo-83-vinu490` measures `+0.749952 px` on the same declaration — the
  opposite sign, and it is the polyline fixture. Both are pinned.
- **Impact**: `pavuzo` is the mission's exit-bar number (`-1.579968` →
  ~0.002). `kejabo`'s sign difference is NOT a defect signal: polyline and
  ortho are different routings and there is no prediction on record for
  kejabo. It is pinned so T8 can attribute whatever it does.
- **Confidence**: High.

## Hazard for T8: `bbW`/`bbH` here are `layoutGraph()` canvas size

Not the ink extent the diagnosis note quotes (pavuzo inner scope: this pin
says `103.6625`, the note says ink `106.581238`). Different quantities,
both real. Compare T8's numbers against **this file's** column, never
against the diagnosis note's.
