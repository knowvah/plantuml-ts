# cdd-B10FU — batch-10 residual round

Status: **executed**, branch `cdd/b10fu`, based on `b3620520` (T35+T36+T37
merged). Full diagnosis artifacts: `plans/class-divergence-drive/
decision-journal.md` rows 235-238.

## Item 1 — pijiju-95-xexi872 (`EntityImageProtected` draw inset): FIXED (partial)

`EntityImageProtected.java:76-83` inflates a `skinparam groupInheritance`
leaf's DOT node by `2*border` on both axes and draws the wrapped
classifier under `UTranslate(border, border)`. This port already applied
the DOT-node inflation but drew the visible box/badge/rows/dividers at
the OUTER (padded) box, and the canvas ink walk double-counted the same
padding as real ink.

`ClassifierGeo` grows `protectedBorder?: number` (set in
`class-geo-builders.ts`, gated the same way `class-dot-graph.ts
#protectedPad` gates the DOT node's own inflation). `x`/`y`/`width`/
`height` stay the OUTER box (still needed by `renderer-group.ts
#renderGroupInheritanceNeighborhood`'s bracket decoration, which routes
to where sibling edges actually terminate). `renderer-classifier-box.ts
#renderClassifierBox` and `class-ink-box.ts#addClassifierInk` each draw/
measure the INNER box via one shared `protectedInnerBox()` (moved to
`class-dot-graph.ts` so the layout-side ink walk doesn't import a
renderer module — `parse -> layout -> render`).

`render-diff.mts`: 0+183 -> 0+19. The rect/header/rows/dividers are now
byte-exact (jar's `<rect x="7" y="111" width="41.363" height="62">`
matched exactly). The remaining 19 diffs are confined to the
`Neighborhood` triangle/stub decoration's own contact-point precision
(sub-0.02px to 1.5px) — a separate, smaller, pre-existing mechanism this
task did not chase (edge-contact geometry, not the draw-inset this item
targeted).

Full-corpus sweep found two BONUS fixtures: `lazeju-60-boki114` and
`xifuza-00-paze682` went `structural-match -> conformant`. One
pre-existing pinned test (`class-edge-geo.test.ts`) asserted a STALE
contact-point value (`y: 96`) that was itself downstream of the same
bug (the whole document's ink-shift/margin shrank once the ink walk
stopped over-counting the protected padding) — updated to the new,
jar-verified value (`y: 76`, confirmed via `lazeju`'s own render-diff
going 0+0).

## Item 2 — dorafa-63-soba922 (`sameClassWidth` badge recentring): RE-FILED, more precisely

Traced past T37's original filing to the EXACT mechanism. The width
FLOOR itself (`applySameClassWidthFloor`) is correct and fully wired —
both rects render at the identical floored width, byte-exact. The
residual is the header BADGE + name-row `indent`, both derived from
`h1`/`h2` (`class-badge.ts#computeHeaderSlack`), which is computed
during `preMeasureClassifiers` (`class-layout-generic-classifier.ts
#computeClassifierGeoPipeline:227-239`) — BEFORE `applySameClassWidthFloor`
runs (that floor is a cross-classifier pass over ALL measured
classifiers, so it can only run after every classifier's OWN measurement
completes; unlike `minClassWidth`, which is a static per-classifier
constant already correctly folded into `width` at line 234 of that same
function, `sameClassWidth`'s floor is a GLOBAL max that cannot be known
until every classifier has been measured).

Jar computes this FRESH at draw time from the FINAL width
(`EntityImageClass.java:182,238`: `dimTotal = calculateDimension(...)`
— which DOES include the `sameClassWidth` floor per
`EntityImageClass.java:108-110` — then `header.drawU(ugHeader,
dimTotal.getWidth(), ...)`), never cached from measure time. This port's
architecture bakes `badgeIndent`/`indent` into `MeasuredClassifier.rows`
at measure time and never revisits them.

A correct fix needs EITHER (a) restructuring the measurement pipeline so
`computeHeaderRowsGeo` (already exported, reusable) runs AFTER
`applySameClassWidthFloor` for every classifier — deferring header-row
geometry for ALL classifiers, not just floored ones — or (b) storing
enough intermediate state (`headerNameGeo`, `stereoGeo`, `fonts`,
`guillemet`/`badgeRadius`/`stereoFont`) on `MeasuredClassifier` to
re-invoke `computeHeaderRowsGeo` for just the floored classifiers after
the fact. `MeasuredClassifier` currently stores none of these
intermediates (only final geometry: `width`/`height`/`rows`/`dividerYs`/
...). Either path touches the measurement pipeline architecture across
`class-layout-generic-classifier.ts`, `class-layout-header-geo.ts`,
`class-dot-graph.ts` and `class-layout-helpers.ts`'s `MeasuredClassifier`
type — not narrow. Re-filed in `planning/next-missions.md` with this
exact mechanism and the two candidate fix shapes.

## Item 3 — multi-line edge-label margin ink: FIXED for 4/5 named fixtures

`class-ink-box.ts#addEdgeLabelMarginInk`'s multi-line twin,
`addMultiLineLabelMarginInk` (`class-ink-edge-label-margin.ts`, split out
for the 500-line cap). Jar's `addVisibilityModifier` wraps the WHOLE
`create0`/`addSeveralMagicArrows` multi-line block in the SAME
`TextBlockMarged` regardless of line count (`SvekEdge.java:296-306`);
`min(line.x)`/`max(line.x+line.width)` over every `labelLines` entry
always recovers the block's true bounding box under any alignment mode
(proved algebraically: the widest line touches both edges under
left/center; every line's own right edge already equals the block's
under right-align), so no new stored field was needed.

`dofima-22-kofe334`, `jireze-84-loti743`, `sicile-99-pefa679`,
`lapoma-04-vaga142`: all 0+2 (canvas `viewBox`/`width` Δ1) -> 0+0,
conformant. `pixexi-81-sete111` is UNCHANGED by this fix (0+58, same
uniform +5.389 canvas shift as before) — it carries NO edges/relationships
at all, so this mechanism cannot apply to it; the coordinator's grouping
of it under this item is DISPROVED by direct measurement (before/after
byte-identical). Its own mechanism remains open and undiagnosed — see
`next-missions.md`.

## Item 4 — dorelu-66-lixu637 (self-loop magic-arrow angle): FIXED

`SvekEdge#getArrowDirectionInRadianInternal` (`SvekEdge.java:208-217`)
dispatches on `isAutolink()`; the non-autolink branch (already ported) is
the straight start-to-end "compass" angle, but autolink uses
`DotPath#getStartAngle()` (`DotPath.java:299-311`) instead — the FIRST
bezier segment's own start tangent, in the STANDARD `atan2(dy,dx)`
convention (note: the argument order genuinely flips relative to the
non-autolink branch's `atan2(dx,dy)` — verified against the Java source,
not assumed).

`magicArrowAngle` grows an `isAutolink` parameter (`rel.from === rel.to`
at both call sites, threaded with zero net NLOC growth in the caller by
keeping the angle-computation closures inline rather than extracting new
`const`s — the repo's NLOC-worsening hook is strict about this). The
tangent reads `points[0]`/`points[1]` (spline start + first control
point), falling back to `points[3]` (first segment's own end) when the
control point coincides with the start (Java's own zero-length-tangent
guard) — ported for fidelity though no corpus fixture reaches that arm.

Hand-verified against `dorelu`'s own cached edge points BEFORE writing
the fix: all 3 triangle vertices matched jar's golden `<polygon>` to
within 0.003px. `render-diff.mts` confirms 0+8 -> 0+0.

## Gates (final, cumulative across all 4 commits)

`npm test`: 22494 passed / 2 skipped / 6 todo, 807 files (JSON-reporter
count = on-disk `find` count). `npm run typecheck` clean (both
tsconfigs). `npm run lint` clean. `npm run catalog`: regenerated after
item 1 (new `protectedInnerBox`/`ClassifierGeoOptions` exports), no
drift after items 3/4. `dot-sync-report.ts class` 711/712 unchanged
throughout (pre-existing `besepi-37-rori892` only). All touched files
≤500 lines (one new file, `class-ink-edge-label-margin.ts`, split out of
`class-ink-box.ts`).

Full-corpus sweep (`render-all.mts`/`pin-diff.mts`) against the
pre-B10FU baseline: **7 transitions, all `structural-match ->
conformant`, zero regressions** (`dofima-22-kofe334`, `dorelu-66-lixu637`,
`jireze-84-loti743`, `lapoma-04-vaga142`, `lazeju-60-boki114`,
`sicile-99-pefa679`, `xifuza-00-paze682`). Against `measurements/
b9.json` (batch-9 close, predates T35/T36/T37 too): 12 transitions, all
rises, zero regressions.
