# Architecture decisions — `activity-parallel-connectors`

Confirmed 2026-09-10 before decomposition. Treat every one as **locked**.
If a task discovers a conflicting constraint, amend the decision here and
halt for review — do not silently override it.

All paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

## D1 — Fork/split connectors are the ftile builders' vertical drops

**Context.** `ParallelBuilderSplit.ConnectionIn#drawU` (`:194-203`) draws
`(geo.getLeft(), 0) → (geo.getLeft(), geo.getInY())` under `dx(x)`;
`ConnectionOut#drawU` (`:246-261`) draws `(left, outY) → (left, height)`;
`ParallelBuilderFork` is the same shape (`:151-163`, `:202-216`). Nothing
routes from the bar centre. Our `tile-coordinates.ts:338-351` routes every
branch from `barCenterX` through `GConnectionSideThenVerticalThenSide`,
whose `from.x === to.x` (`routing/gconnection-side-then-vertical-then-side
.ts:6`) exists only to collapse that invented elbow.

**Decision.** The fork/split case emits, per branch, the two upstream
segments from the branch's own `NORTH_HOOK` / `SOUTH_HOOK` x. The helper
is no longer called there and loses its `===` collapse; it stays in use by
if/switch, whose upstream shape is a separate filed mission.

**Consequences.** The float-equality rise closes by construction; every
parallel arrowhead is `asToDown`. Rejected: an epsilon in the helper — a
fitted tolerance with no upstream counterpart.

## D2 — `pushEdge` dedupes consecutive exactly-equal points, nothing more

**Context.** `Worm#addPoint` (`Worm.java:253-270`) returns early when the
new point equals the last with `==` on doubles. The jar still emits seven
near-zero segments on three fixtures, so near-equal points survive upstream.

**Decision.** Mirror the exact-equality dedupe at the one edge-construction
seam; no tolerance anywhere.

**Consequences.** A connection producing a coincident point collapses the
way upstream's does; near-zero segments the jar draws stay drawable.
Rejected: epsilon dedupe.

## D3 — The parallel geometry is `computeNewFtile`'s, pre-compression, literal

**Context.** `AbstractParallelFtilesBuilder#computeNewFtile` (`:128-136`):
`xMargin = 14` per side (`FtileMarged`, `FtileMarged.java:93-97`, plus
`getSuppForIncomingArrow`, `:138-156`), `spaceArroundBlackBar = 20`
(`FtileHeightFixedCentered` to `maxHeight + 40`,
`FtileHeightFixedCentered.java:88-98`), then `FtileHeightFixedMarged
(ymargin1, …, ymargin2)` for the tallest in/out link label (`:101-126`,
`FtileHeightFixedMarged.java:89-92`). Branches then pack `x += width`
with no other gap (`FtileForkInner#drawU`). The jar's visible 10 px gap is
`CompressionXorYBuilder` (`ActivityDiagram3.java:209-210`) removing
`28 − 2×5` (`CompressionXorYBuilder.java:56-60`, `smaller(5.0)`) — C2.

**Decision.** Port the four numbers with their citations; delete
`BAR_OVERHANG 10` and the fork's use of `NODE_MARGIN_X 40`. The
uncompressed 28 px gap is recorded as the expected packing delta and never
narrowed to 10. Our fork AST carries no link labels, so `ymargin1/2` and
the incoming-arrow supplement are ported as functions that receive 0.

**Consequences.** Every fork/split fixture's width moves and may not fall;
the exit bar scores connector and bar families and structure, not width.
Rejected: keeping the unsourced 40/10; fitting 10.

## D4 — Bars: a black block for fork, a thin line for split

**Context.** Fork: `FtileBlackBlock#setBlackBlockDimension(innerWidth,
barHeight)` (`ParallelBuilderFork.java:98,112`; `barHeight = 6`,
`AbstractParallelFtilesBuilder.java:64`), drawn in swimlane `in` (step 1)
or `out` (step 2), rect stroked at `UStroke` default in its own colour
(`FtileBlackBlock.java:101-110`; the missing stroke is a filed defect,
not this mission's). Split: `FtileThinSplit` is `ULine.hline(last − first)`
at `dx(first)`, height 1.5, stroke 1.5 (`FtileThinSplit.java:61,76-96`);
`first..last` span the branches with an in point (step 1, `:77-113`) or an
out point (step 2, `:136-180`); colour `none` when every in-link is
invisible (`getThin1Color`, `:114-125`); when no branch has an out point
the split becomes `FtileKilled` with no join line and no out point
(`:127-141`, `FtileKilled.java:71-74`).

**Decision.** Node kinds `fork-bar` / `join-bar` (rect, height 6, inner
width) and `split-bar` / `split-join-bar` (line, height 1.5,
`x = first`, `width = last − first`); `renderBar` dispatches on kind;
`BAR_HEIGHT 8` and the split rects are deleted. `ActivityNodeGeo.kind`
is already an open `string`, so no type file changes.

**Consequences.** `rect[]` / `line[]` counts on split fixtures move toward
the jar's. The lane-clipped bar width in swimlane goldens stays a C2 delta.
Rejected: one bar shape for both styles.

## D5 — A `hasPointOut()` query on `Tile`, modelled on `FtileGeometry`

**Context.** Upstream marks "no out point" with `outY == Double.MIN_NORMAL`
(`FtileGeometry.java:57-78,141-143`), propagated by `appendBottom`
(`:190-`) and `FtileKilled`; the builders gate every out connector and the
`first..last` extent on `hasPointOut()` (`ParallelBuilderSplit:127-133`,
`:150-176`; `ParallelBuilderFork:123-126`).

**Decision.** `Tile.hasPointOut(): boolean` — `false` on stop/end/kill/
detach leaves; a top-down's is its last child's; a fork/split's is "any
branch has one" (`hasOut()`); other composites `true` with their Java
citation, or a filed exception where the Java disagrees.

**Consequences.** Detached branches stop receiving join connectors (21 of
the 32 fixtures); `childCount` moves toward the jar. Rejected: inferring
termination from node kind in the coordinate pass.

**Amended 2026-09-10 (T1, flagged for review).** The "any branch has one"
rule holds for split only. `ParallelBuilderFork#doStep2`
(`ParallelBuilderFork.java:110-131`) always assembles an unconditional
`FtileBlackBlock` join bar whose geometry is the five-argument constructor
with `outY = height` (`FtileBlackBlock.java:94`), and `FtileAssemblySimple
#calculateDimension` (`:124-130`) takes the LOWER tile's out point through
`FtileGeometryMerger` (`:49-53`); the fork is never wrapped in
`FtileKilled`. So `GtileFork.hasPointOut()` is unconditionally `true`;
`GtileSplit` keeps `hasOut()` (`ParallelBuilderSplit.java:150-151`). Each
BRANCH's own `hasPointOut()` still gates its join connector in both styles.
T3's "no join node when no branch continues" applies to split only.

## D6 — Cross-lane fork/split elbows use `+4` and `−14`

**Context.** `ConnectionIn#drawTranslate` puts the horizontal at
`mp1a.y + 4`; `ConnectionOut#drawTranslate` at `mp2b.y − 14`
(`ParallelBuilderFork.java:166-184, 220-241`; `ParallelBuilderSplit.java
:207-225, 264-285`). `swimlane-placement.ts`'s module doc names its
average-Y fallback for these as a bounded simplification justified by our
un-derived bar geometry — a justification D3/D4 remove.

**Decision.** `EdgeMeta` gains `shape: 'parallel-in' | 'parallel-out' |
'default'`, set at `pushEdge`; `routeEdge` applies the two literals to the
parallel shapes and keeps the average-Y shape for everything else.

**Consequences.** The 17 laned fork/split fixtures move on their cross-lane
segments only. Rejected: leaving the fallback.

## D7 — No new pin; measured on the 32-fixture subset with existing instruments

**Context.** The style census pins per-fixture `<line>` counts and
canvases, the ratchet every score, the swimlane census lane extents, the
text census fills/anchors/insets.

**Decision.** T0 is a scratch probe over the 32 split/fork fixtures
(aggregate, families, risers); baselines re-pin once at T6.

**Consequences.** Attribution per task comes from sequencing, each task
measured on the subset. Rejected: a fifth census file for 32 fixtures.
