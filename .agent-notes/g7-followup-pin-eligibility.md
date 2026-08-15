## Observation: DOT size-exactness does NOT imply SVG pin eligibility

- **Context**: Working G7's journaled follow-up 1 — "generate svg-state
  goldens for the 18 size-exact family fixtures … then pin them (they are
  DOT-EQUAL in `parity-state.json`, so eligible once a golden exists)".
- **Finding**: The follow-up is not executable, because its premise is
  wrong. `oracle/goldens/svg-state/README.md#add-rule` requires **two**
  conditions, and DOT-EQUAL is only the second. The first is a zero-diff SVG
  under `DeterministicMeasurer`. Measured across the 24 border-point family
  fixtures (`<<entrypoint>>`/`<<exitpoint>>`/`<<expansionInput>>` in the
  state dot-cache): **zero are zero-diff**. 17 report 1 diff, 6 report 3,
  one reports 5.

  G7's "18/22 size-exact" came from `measure-state-size-deltas.ts`, which
  measures **DOT node-size** delta. Pin eligibility measures **SVG bytes**.
  Two different axes; the follow-up read the first as implying the second.
- **Impact**: Anyone picking up a "just generate the golden and pin it"
  task must check the census first. A fixture can be DOT-perfect and
  size-perfect and still be far from byte-conformant.
- **Confidence**: High — measured on the current tree with the same census
  the ratchet's own add rule cites.

## Observation: a `childCount` diff of 1 means the comparison STOPPED, not that one attribute is off

- **Context**: Same measurement. 17 of the 24 family fixtures report
  exactly `1` diff, which reads like near-conformance.
- **Finding**: The single diff is `svg/g[1][childCount]` on the ROOT content
  `<g>`, and `compareSvg` stops recursing at a childCount mismatch (the same
  property `plans/namespace-cluster-box/README.md` flagged when the census
  went byte-identical across two real fixes). Everything below the root is
  therefore UNCOMPARED. Actual counts: `bitaxo-18-tamo974` 4 vs jar's 6,
  `kotagu-43-miza629` 13 vs 14, `jucori-40-cevo136` 13 vs 21.

  Mechanism, from dumping the root `<g>`'s direct children on bitaxo: jar
  emits a FLAT mix — `g.cluster`, bare `text`, bare `ellipse`, bare `rect`,
  `text`, `g.entity` — whereas this port wraps every entity in its own
  `<g class="entity">` (4 wrappers, no bare shapes). So the gap is element
  GROUPING, not absent content.

  That is the corpus-wide G-phase defect #2 ("`g[childCount]` mismatch —
  215 fixtures … missing/extra elements, not geometry",
  `planning/mission-index.md` Phase G), not anything border-point-specific.
- **Impact**: Treat a diff count of 1 as a floor, not a measurement,
  whenever the one diff is a `childCount`. Ranking work by diff count will
  systematically rank these fixtures as nearly-done when they are not. Any
  mission to pin the state family has to close the entity-wrapping
  divergence first, and that is corpus-wide, not per-family.
- **Confidence**: High — diffs printed directly through the ratchet's own
  `renderFixtureState` + `compareSvg` path, children enumerated from both
  SVGs.

## Observation: `measure-state-size-deltas.ts` exits 2 on a 1e-6 float wobble

- **Context**: Re-measuring G7's follow-up 2 residuals.
- **Finding**: The harness reports `widened: 1` for `tumaba-64-tosu281` —
  measured `0.2291679999999996` against a stored allowance of
  `0.22916699999999945`. That is 1e-6 inch (~7e-5 px), and it makes the
  script exit non-zero. Verified **pre-existing**: checking out `main` with
  no local changes reproduces the identical summary
  (`total:149, widened:1, improved:2, unchanged:146`).
- **Impact**: Anyone running this harness as a gate will see a non-zero exit
  that is not their regression. Re-pinning the allowance would clear it, but
  the backlog is tighten-only and removal is maintainer-ruled, so it needs a
  decision rather than a quiet edit.
- **Confidence**: High — same command, both branches, byte-identical output.
