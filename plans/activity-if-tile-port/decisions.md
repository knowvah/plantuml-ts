# Architecture decisions — `activity-if-tile-port`

Confirmed 2026-09-15 before decomposition. Treat every one as **locked**. If
a task discovers a conflicting constraint, amend the decision here and halt
for review (stop 3) — never silently override it.

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

## D1 — Mirror the jar's builders, one tile class each

**Context.** `FtileFactoryDelegatorIf#createIf` routes `thens.size() > 1` to
`FtileIfLongHorizontal` (or `FtileIfLongVertical` under `useVerticalIf`)
and everything else to `ConditionalBuilder.create`
(`vcompact/FtileFactoryDelegatorIf.java:85-92`), which picks `FtileIfDown`
when exactly one branch is empty or a lone `stop`/`end`/`kill`/spot
(`vcompact/cond/ConditionalBuilder.java:149-159`, predicate
`InstructionList.java:90-106`) and `FtileIfWithLinks` otherwise (`:161`).
The three geometries share nothing but two branch children.

**Decision.** Three tile classes: `tiles/gtile-if-with-links.ts`
(`GtileIfWithLinks`: geometry of `FtileIfNude` + `FtileIfWithDiamonds`,
connectors of `FtileIfWithLinks`), `tiles/gtile-if-down.ts` (`GtileIfDown`),
`tiles/gtile-if-long-horizontal.ts` (`GtileIfLongHorizontal`). A new
`layout/conditional-builder.ts` holds the dispatch, ported predicate
included; `tile-layout.ts#tileIf` calls it. `GtileIf` is deleted by T5, the
task that lands the last builder. Rejected: one class with a shape flag —
a structure the jar does not have (CLAUDE.md: a structural divergence IS
the bug).

**Consequences.** Three tile test files replace `gtile-if.test.ts`; the
walker gains one case per kind; `GConnectionSideThenVerticalThenSide` keeps
only its `switch` caller.

## D2 — Hexagon condition and rhombus merge as their own tiles

**Context.** Both `FtileIfDown` and `FtileIfWithLinks` build `diamond1` as
`FtileDiamondInside` (`ConditionalBuilder.java:238-258`, the default
`INSIDE_HEXAGON` branch): `calculateDimensionAlone` is `24x24` for an empty
label, else `label.atLeast(24, 24).delta(24, 0)`, geometry `(dim, left =
w/2, inY 0, outY h)` (`vertical/FtileDiamondInside.java:104-116`), drawn as
`Hexagon.asPolygon(shadow, w, h)` (`Hexagon.java:66-73`). `diamond2` is a
`FtileDiamond` — `24 x (24 + northLabelHeight)`, `left 12`, `inY =
northLabelHeight`, `outY = h` (`vertical/FtileDiamond.java:108-112`), a
4-point rhombus (`Hexagon.java:49-56`) — when both branches have a point out,
else `FtileEmpty(0, 6)` (`ConditionalBuilder.java:285-311`). Our
`GtileDiamond` sizes `halfW = max(w/2 + 10, 20)`, `halfH = max(h/2 + 4, 20)`
(`tiles/gtile-diamond.ts:24-29`) and is shared with while/repeat.

**Decision.** New `tiles/gtile-diamond-inside.ts` (`GtileDiamondInside`,
the jar's dims, N/S/E/W label slots, `swapEastWest`) for the condition;
`if-merge` nodes for `diamond2`, rendered as the rhombus and given a
compress box (`compress/shapes-of.ts` `NO_SHAPE_KINDS` loses `if-merge`).
`GtileDiamond` is untouched: T1 measures whether it already equals
`FtileDiamondInside` on a labelled hexagon; if not, T7 files a while/repeat
follow-on (stop 13 forbids widening here).

**Consequences.** One new tile module; `activity-renderer-shapes.ts`
`if-merge` case draws instead of returning `''`.

## D3 — Branch labels are `if-label` text nodes, sized into the tile

**Context.** `getLabelPositive(branch)` (`ConditionalBuilder.java:280-283`,
arrow font) becomes the hexagon's south + east labels for `FtileIfDown`
(`getShape1(false, …)`, `:245-248`) or west + east for `FtileIfWithLinks`
(`getShape1(true, …)`, `:242-244`); `FtileDiamondInside.drawU` places south
at `(4 + w/2, h)`, west at `(-westW, h/2 - westH)`, east at `(w, h/2 -
eastH)` (`vertical/FtileDiamondInside.java:84-102`). They feed sizing:
`computeMarginNeedForBranchLabe1/2`, `computeVerticalMarginNeedForBranchs`
(`cond/FtileIfWithDiamonds.java:250-281`), `getSouthLabelHeight` /
`getEastLabelWidth` (`vcompact/FtileIfDown.java:587-605`), `inlabelSizes`
and `withNorth` (`vcompact/FtileIfLongHorizontal.java:167-192`). The merge
rhombus carries the out-labels as north/west/east
(`ConditionalBuilder.java:294-307`).

**Decision.** The walker emits one `if-label` node per non-empty label at
the jar's translate, rendered by `renderLabel` with the `arrow` SName; each
tile class measures the labels with the bounder and folds them into its
width/height exactly as the Java does.

**Consequences.** `ActivityNodeGeo` needs no new field (`kind`, `label`,
`x`, `y`, `width`, `height` suffice); `shapes-of.ts` gives `if-label` a
text box.

## D4 — Sizing ports the jar's arithmetic with its wrappers folded in

**Context.** Every branch is `FtileMinWidthCentered(branch, 30)`
(`ConditionalBuilder.java:139-140`; `FtileMinWidthCentered.java:68-79,
99-106`: width at least 30, content and `left` shifted by half the
difference) then `addHorizontalMargin(_, 10)` (`FtileMarged.java:93-97`:
width + 20, `left` + 10). `FtileIfNude` gives width `dim1.left + innerMargin
+ (dim2.w - dim2.left)`, `left = dim1.left + innerMargin/2`, `innerMargin =
max((dim1.w - dim1.left) + dim2.left, diamond1.w + 20)`
(`cond/FtileIfNude.java:142-160`; `cond/FtileIfWithDiamonds.java:72,
173-176`); `FtileIfWithDiamonds` stacks `diamond1.appendBottom(nude)
.appendBottom(diamond2)` and adds `getYdelta1a() + getYdelta1b()` — 10/20
and (hasTwoBranches ? 6 : 0)/10 without/with more than one lane
(`:156-166,179-193`); branches sit at `y = diamond1.h + ydelta1a`
(`:221-232`); `createWithLinks` then adds the label margins
(`ConditionalBuilder.java:213-231`). `FtileIfDown`: `d1.appendBottom(then)
.appendBottom(d2)`, height `+ 3*12 + max(12, southLabelH)`, width `+ 12`
(+ stop width + `getAdditionalWidth`) (`vcompact/FtileIfDown.java:543-578`),
then-block centred vertically between the diamonds (`:624-637`).
`FtileIfLongHorizontal`: couples = `FtileAssemblySimple(diamond_i, tile_i)`
with a left margin of the inlabel width (`:91-108`), diamonds aligned to
the tallest with `addVerticalMargin(missing/2, 20)` (`:110-121`), couple i
at `x = Σ(w_j + 20)`, `y = 25` (`:657-669`), `tile2` at `x = W - w2`, `y =
(H - h2)/2` (`:624-635`), `W = Σ couples.w + tile2.w + 20 * n`, `H =
max(couples.h, tile2.h + diamondsH/2) + max(100, maxOutY)`, `left = W/2`,
`inY 0` (`:679-700`). `FtileGeometry#appendBottom` aligns on the larger
`left` (`FtileGeometryMerger.java:44-56`); `XDimension2D#mergeLR` sums
widths and takes the max height (`klimt/geom/XDimension2D.java:108-112`).

**Decision.** Each tile class ports these formulas verbatim, wrappers
folded into its own constructor, every constant with its `file:line`.
`NODE_MARGIN_X`/`NODE_MARGIN_Y` no longer appear in any if tile.

**Consequences.** The old `GtileIf` positions change for every `if`; the
`layout.test.ts` if cases are re-asserted against the Java, never deleted.

## D5 — One walker module per builder, one function per Java `Connection`

**Context.** The jar's connections are inner classes of each builder with
builder-specific inputs (`xmax`, `nbOut`, `totalHeight`, `optionalStop`);
there is no shared routing class. Our `GConnectionSideThenVerticalThenSide`
draws the transposed L that is today's defect.

**Decision.** `layout/walk-if-with-links.ts`, `walk-if-down.ts`,
`walk-if-long-horizontal.ts`, each with one function per `Connection`
computing its points from the tile hooks exactly as `getP1/getP2` do, and
one `walk…` entry that emits the nodes in `drawU` order, then the
connections in `conns` order. `tile-coordinates.ts` dispatches by tile kind.
No new `routing/gconnection-*` classes.

**Consequences.** Three new modules under 500 lines each; the `'gtile-if'`
case disappears with `GtileIf` (T5).

## D6 — Edge decorations: `arrowhead?: false` and `emphasize: Direction`

**Context.** `ConnectionHorizontalThenVertical` passes a `null` end
decoration when the branch is empty (`cond/FtileIfWithLinks.java:96-101`);
`…Direct` (`:288-367`), `ConnectionHline` and `ConnectionElseNoDiamond`'s
parent shapes carry none either. `emphasizeDirection(DOWN)` marks the FIRST
segment whose direction is DOWN (`Worm.java:138-139`) and draws
`arrows.asTo(direction)` at that segment's midpoint (`:178-183`). Our
`ActivityEdgeGeo.midArrow` puts the arrow on the LONGEST segment
(`renderer.ts:176-195`).

**Decision.** `ActivityEdgeGeo` gains `arrowhead?: false` (renderer skips
the end tip) and `midArrow` is replaced by `emphasize?: 'up' | 'down' |
'left' | 'right'` placed per `Worm.java:138-139,178-183`. The repeat
back-edge (`tile-coordinates.ts` `'gtile-repeat'`, the only `midArrow`
caller) migrates to `emphasize: 'up'`; T1 verifies its pins cannot move.

**Consequences.** One optional-field addition and one rename on an internal
type (no external consumers — `plantuml-ts` has none); `shapes-of.ts` and
the renderer read the new fields.

## D7 — Draw order is the conns list, sibling links after both endpoints

**Context.** `FtileWithConnection#drawU` (`FtileWithConnection.java:69-74`)
draws the delegate then the connections. The vertical link between two
siblings is added AROUND `FtileAssemblySimple` by
`FtileFactoryDelegatorAssembly#assembly` (`vcompact/
FtileFactoryDelegatorAssembly.java:78-79`), whose `drawU` draws only the two
tiles (`FtileAssemblySimple.java:108-112`) — so the link follows BOTH
endpoints' internals. Ours pushes it before walking the next child
(`tile-coordinates.ts:166-179`). Lane passes are applied last (parent D1,
`layout/edge-draw-order.ts`).

**Decision.** Each walker pushes connections in its builder's `conns`
order; `gtile-top-down` walks child i+1 and THEN pushes link i->i+1 (T6,
measured alone). `EdgeMeta` lanes come from `laneIn`/`laneOut` of the
endpoint tiles; `diamond2`'s lane is the if's own (`FtileIfNude.java:89-95`,
`FtileIfDown.java:97-105`: `getSwimlaneOut` is `getSwimlaneIn` unless
`optionalStop`).

**Consequences.** Unobservable for leaf siblings; T6's movers are every
fixture with a compound child that has internal edges.

## D8 — Scope: default styles; the rest is FILED

**Context.** `conditionStyle` and `conditionEndStyle` are set in 2 + 2 of
the 123 fixtures; `useVerticalIf` in 0; `switch` is a separate builder
family; notes on an `if` are `opale` blocks that widen the tile
(`cond/FtileIfWithDiamonds.java:79-114`); the `drawTranslate` variants of
`ConnectionHorizontalThenVertical` / `ConnectionVerticalThenHorizontal`
draw two snakes with a hexagon-sized hop (`cond/FtileIfWithLinks.java:
149-174,232-286`).

**Decision.** In scope: `INSIDE_HEXAGON` + `ConditionEndStyle.DIAMOND`;
`ConnectionElse1` AND `ConnectionElse2` (`FtileIfDown.java:139-146`: Else1
when the if's lane is `isSmallerThanAllOthers` of the then-block's lanes,
`Swimlane.java:130-137`, with `swapEastWest`); `optionalStop` +
`ConnectionHorizontal`; `ConnectionElseNoDiamond`; the simple cross-lane
middle rules of `ConnectionIn/Out.drawTranslate` (middle `y = (y1 + y2)/2`,
`FtileIfDown.java:225-238,286-301`) and `ConnectionVerticalIn.drawTranslate`
(`middle = y1 + 4`, `FtileIfLongHorizontal.java:419-435`) as `EdgeShape`
tags. Everything in Context is filed by T7 with a cite, never built (stop
10).

**Consequences.** Some residual on the 4 styled fixtures and on notes-on-if
fixtures is named, not fixed.

## D9 — Diagnose first; element parity is the exit signal; one re-pin

**Context.** `weightedScore` pairs elements positionally and charges the sum
of both sides on a child-count mismatch (`tests/oracle/svg-conformance/
compare.ts:404`), so ADDING the jar's missing elements can raise a score
while alignment improves (`plans/activity-edge-draw-order` T4: `maketa`).
The four activity gates are equality pins.

**Decision.** T1 lands no `src/` edit: it records `measurements/base.json`,
rewrites `fixtures.md` from the ported dispatch predicate, dumps three
representative fixtures per builder into per-builder ELEMENT TEMPLATES
(the acceptance oracle for T3–T5), and adds `--align <slug>` to the probe.
Each builder task measures against the previous task's JSON and its
template; T7 re-pins once. The aggregate is reported in every journal row
and gated nowhere.

**Consequences.** Sequential batches; every riser costs a journal row before
its commit; the exit bar is counts + alignment, not the sum.
