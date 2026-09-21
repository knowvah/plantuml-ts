# T13 — cluster-anchored edge clipping

**Agent:** typescript-pro (sonnet) · **Depends on:** — · Parallel with T11.

## Context

When a relationship endpoint is a package/namespace, svek routes the edge
to a `zaent…` anchor placed inside the cluster, then trims the spline back
to the cluster's rectangle: `svek/SvekEdge.java:252-258` sets `ltail`/`lhead`
when the uid begins with `Cluster.CENTER_ID`, `:671-672` calls
`dotPath.simulateCompound(lhead.getRectangleArea(),
ltail.getRectangleArea())` (`klimt/shape/DotPath.java#simulateCompound`, 8
midpoint subdivisions via `XCubicCurve2D#subdivide`). We emit the identical
DOT (gate is 710/711) but draw the spline raw — `bajotu-30-soku184`'s edge
starts 47px inside the package box instead of on its border
(`diagnosis/A5-geometry.md` M1). The clip function is already a faithful
port at `src/core/spline-clip.ts:135` (`clipSplineStart`) / `:171`
(`clipSplineEnd`) — its only callers today are `state-transition-clip.ts:
123-124` and `description/layout-geo-post.ts:53,61`; `grep -rn "clipSpline"
src/diagrams/class` returns nothing. The report already replayed the clip
on `bajotu`'s own spline and found a RESIDUAL in the earlier control points
(4 segments starting 119.338 vs the jar's 3 starting 119.013; the last
control point agrees, 141.969 vs 141.97) — this is a dot-engine spline-shape
delta, not a clip bug. The report is a lead: re-read `SvekEdge.java` and
`spline-clip.ts` before editing.

## Task

1. Tests first: a `class-edge-geo.test.ts` case with a package-anchored
   edge asserting the emitted path starts/ends on the cluster rect boundary
   (use `bajotu-30-soku184`'s cached `svek-N.dot` + `in.svg` as the oracle
   values).
2. Thread the cluster rectangle through `class-edge-geo.ts` — it already
   tracks `anchors: Map<nsId, zaent-id>` (`class-shield-helpers.ts:73-78`,
   `class-dot-graph.ts:439`); add the rect lookup alongside the anchor.
3. Call the existing `clipSplineStart`/`clipSplineEnd` on any edge whose
   start/end anchor resolves to a cluster, mirroring `SvekEdge.java:
   671-672`'s `simulateCompound` call exactly (both ends independently — an
   edge can be cluster-anchored on one end only).
4. Replay `bajotu-30-soku184` and `bejusa-95-gafo325` (`npx tsx
   tools/render-diff.mts bajotu-30-soku184 bejusa-95-gafo325`). If either is
   not byte/numeric-exact after the clip lands, do NOT tune constants to
   force it — the report already isolated the residual to earlier control
   points (dot-engine spline shape). Confirm the residual is in the
   *interior* control points and not the endpoint by comparing the emitted
   path's first/last coordinates against the jar's; if confirmed, journal it
   per stop 8: a `.md` in `docs/graphviz-issues/` + a `TRACKER.md` line,
   filed before this task closes.
5. Run `render-all.mts` over the 17 GEO1-cluster fixtures named in the
   reach list; confirm the clip does not regress any currently-conformant
   fixture.
6. `.agent-notes/cdd-T13.md`: the residual finding (exact or named) and the
   `docs/graphviz-issues/` filename if filed.

## Read-set

Java: `svek/SvekEdge.java:252-258,671-672`; `klimt/shape/
DotPath.java#simulateCompound` (whole method). TS:
`src/core/spline-clip.ts:100-200` (`clipSplineStart`/`clipSplineEnd` and
their call contract); `src/diagrams/class/class-shield-helpers.ts:73-78`;
`src/diagrams/class/class-dot-graph.ts:420-450`;
`src/diagrams/class/class-edge-geo.ts` (whole, for the insertion point);
`src/diagrams/state/state-transition-clip.ts:110-140` (existing caller
pattern); `src/diagrams/description/layout-geo-post.ts:40-70` (existing
caller pattern). Diagnosis: `diagnosis/A5-geometry.md` M1 (whole section).

## Write-set

`src/diagrams/class/class-edge-geo.ts`, `class-edge-geo.test.ts`,
`.agent-notes/cdd-T13.md`, `docs/graphviz-issues/*.md` (only if stop 8
fires), `plans/class-divergence-drive/decision-journal.md` (append-only).

## Acceptance criteria

- Given `bajotu-30-soku184`, when rendered, then the edge starts on the
  package border (y≈119, matching `svek-N.dot`'s `-Tplain` bbox) with the
  jar's segment count, or the residual is named per step 4
- Given `bejusa-95-gafo325`, when rendered, then both cluster-anchored ends
  are clipped to their border, exact or residual named
- Given the 17 GEO1 fixtures (`bajotu-30-soku184`, `bejusa-95-gafo325`,
  `cocube-46-tusu692`, `delasa-80-jusu462`, `guxode-39-dobi371`, `jojime-
  80-savu279`, `lojiga-09-meka859`, `mujopi-30-zadi566`, `nijeli-04-
  ponu844`, `pecabi-95-demu756`, `pisobo-93-sipa138`, `rezoba-58-xaze387`,
  `runane-30-vena766`, `sanixi-31-nofa193`, `sijisi-94-ripu606`, `sokevu-
  87-toce485`, `vusute-48-xono099`), when rendered, then every cluster-anchored
  edge starts/ends on its cluster's border (exact or residual named per
  fixture)
- Given the DOT-parity gate, then it stays 710/711 (no DOT change, render
  only)

## Observability

N/A — no new observable operations; render-path fix only.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`npx tsx tools/render-diff.mts` on all 17 GEO1 fixtures before/after,
structural+numeric counts in the commit body. Files ≤500 lines, functions
≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: call the existing `clipSplineStart`/`clipSplineEnd` rather than
reimplementing `simulateCompound`; journal a dot-engine residual instead of
tuning a constant to hide it. Ask first: any stop condition in
`../README.md`. Never: modify `src/core/spline-clip.ts` itself (shared with
state/description — a change there is a different task's write-set); fit a
value; edit outside the write-set.

## Commit

`fix(cdd-T13): clip cluster-anchored edges to the package border`

Body: why — M1's mechanism (DOT is correct, render never clips); note
whether `bajotu`/`bejusa` land exact or the dot-engine residual was filed.
