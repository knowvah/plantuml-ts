# T9 — CLIP-1: edges ending on a cluster anchor

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T6 ·
parallel with T7 (disjoint write-sets).

## Fixtures

bejusa-95-gafo325, runane-30-vena766, vusute-48-xono099,
pisobo-93-sipa138, rezoba-58-xaze387 (from T8), jojime-80-savu279 (from
T8); guxode-39-dobi371's numeric half (T8 owns its row).

## Mechanisms

**CLIP-1 — reopened; diagnose first (stop 10 applies to both priors).**

`diagnosis/D.md` (D-1) and `diagnosis/S.md` (S-9) both blamed
`@knowvah/dot-engine`'s raw spline. T6 disproved both by measurement
(journal rows 5-6): feeding the jar's own `svek-1.dot` to real graphviz
16.1.0 and to dot-engine gives IDENTICAL control points, offset by a
constant frame translation:

- runane edge `sh0044 -> zaent0005`: graphviz `331.9,475.77 324.84,397.63
  302.36,148.93 302,145.05` (y-up, bb height 737) vs dot-engine
  `321.905,251.227 314.842,329.367 292.36,578.073 292.009,581.954`
  (y-down, probe frame) — every point differs by exactly (10, 10).
- rezoba, jojime: every edge ends on a `zaent<N>` cluster anchor; all
  points match graphviz up to constant (48.32, 65) / (47.64, 65).

So the Δ≈20 px (D) and the small path deltas / point-count changes (rezoba
has DIFFERENT point counts) arise AFTER layout, in how an edge ending on a
cluster anchor is clipped or post-processed. What D.md still establishes:
DOT emission equals `svek-1.dot`; the drawn cluster box equals the jar's.
It asserted `spline-clip.ts#clipSplineEnd` is a faithful port of
`DotPath#simulateCompound` (`DotPath.java:462-489`) but only by feeding it
OUR inputs, so the clip RECTANGLE (which cluster's `getRectangleArea` —
`SvekEdge.java:252-258,671-672`, `getCluster2`, `Cluster#setPosition`),
its coordinate frame, and whether the jar's `in.svg` path shows a clip at
all are all unverified. Instrument: take graphviz's raw spline, apply
`simulateCompound` by hand with the jar's cluster rectangle, and compare
to `in.svg`; then find where we differ. Probe scripts:
`diagnosis/scratch/raw-edges.mts <slug>` (dot-engine raw points),
`dump-edge-points.mts`, `verify-clip.mts`.

## Write-set

`src/core/spline-clip.ts`, `src/diagrams/class/class-shield-helpers.ts`,
`src/diagrams/class/class-edge-geo.ts` (`clipClusterEdgeEnds` only —
`attachKalBoxes` belongs to batch 2), `src/diagrams/class/class-cluster-levels.ts`,
`src/diagrams/class/class-dot-clusters.ts`, tests beside each. A mechanism
outside this list: report and stop (stop 1). A mechanism truly inside
dot-engine after all: stop 8.

## Read-set

`diagnosis/D.md`, `decisions.md` D2, D4; `svek-N.dot` for each fixture
(`test-results/dot-cache/class/<slug>/`).

## Acceptance criteria

- Given each fixture, when it renders, then its edge geometry matches the
  jar (the Δ20 offset is gone)
- Given DOT emission changed, when `tests/oracle/class-dot-parity.test.ts`
  runs, then it is still 711/712 and these fixtures' DOT equals `svek-N.dot`
- Given a parser change, when the class unit suite runs, then no existing
  namespace test changes expectation without a journaled Java citation

## Observability · Rollback

N/A. Reversible — layout moves for dotted-name fixtures only; the close
task's pin-diff proves the reach.
