# Architecture decisions — `activity-loop-tile-port`

Confirmed 2026-09-16. **Locked**; amend and halt on contradiction (stop 3).
Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/`
(ftile classes under `ftile/vcompact/` and `ftile/vertical/`).
`Hexagon.hexagonHalfSize = 12` (`ftile/Hexagon.java:46`).

## D1 — Loop hexagons are `GtileDiamondInside` with the jar's side labels

**Context.** The while header is `new FtileDiamondInside(testTb, …)
.withNorth(yesTb).withWest(outTb)` (`vcompact/FtileWhile.java:125-127`);
the repeat condition is `new FtileDiamondInside(tbTest, …).withEast(yesTb)
.withSouth(outTb)` (`vcompact/FtileRepeat.java:150-151`; `withWest(yesTb)`
only when `backwardExitsOnLeft`, `:145-149`, unreachable without
`backward`). `FtileDiamondInside#calculateDimensionAlone`
(`vertical/FtileDiamondInside.java:104-116`): `max(label, 24x24) +
(24, 0)`. Ours builds both as `GtileDiamond` (`tiles/gtile-diamond.ts`,
`DIAMOND_MIN=20`, `DIAMOND_LABEL_PAD=10`: 4 px narrower, 16 px taller,
`activity-diamond-sizing`) and drops the labels entirely (`bareka` draws 7
texts, the jar 9). `GtileDiamondInside` (`tiles/gtile-diamond-inside.ts`)
already ports the sizing and the four label slots for the if.

**Decision.** `tileWhile`/`tileRepeat` construct `GtileDiamondInside` with
those slots; the parser stores the repeat's `is (…)`/`not (…)` groups
(`RE_REPEATWHILE` groups 2-3, already matched, currently dropped) as
`yesLabel`/`outLabel`; the walkers emit the side labels the way
`walk-if-down.ts:64-80` does, through a shared helper. `GtileDiamond` and
its constants stay only for readers outside the loop path.

**Consequences.** Loop widths can match the jar; every labelled loop
fixture gains text elements (a known riser class).

## D2 — The repeat entry tile: the inline action, else a 24×24 diamond

**Context.** `FtileRepeat.create` (`vcompact/FtileRepeat.java:77-80`): `if
(entry == null) diamond1 = new FtileDiamond(...); else diamond1 = entry` —
`entry` is the `startLabel` of `repeat :label;` turned into an activity by
the factory (`InstructionRepeat.java:166-167`, `factory.repeat(…,
startLabel, …)`). `FtileDiamond#calculateDimensionFtile`
(`vertical/FtileDiamond.java:108-112`): `24 x (24 + northLabelH)`, `left =
12`. Ours prepends the inline action to the body (`node-dispatch.ts:236-
253`) and has no entry diamond (`activity-diamond-count-shortfall`).

**Decision.** `ActivityRepeat.entry?: ActivityAction` (parser moves the
inline action there); `tileRepeat` builds `entry` as that action's tile or
a new `GtileRepeatEntry` (24×24, hooks at `(12, 0)`/`(12, 24)`, rendered by
the existing `repeat-start` kind, `activity-renderer-shapes.ts:440`);
`GtileRepeat.children = [entry, body, condition]`.

**Consequences.** The `dimDiamond1.getWidth()/2` terms of `getLeft`/
`getRight` (`:769,771,780,782`) become real; 5 fixtures with an inline
action change shape; tests indexing `children[0]`/`[1]` re-assert.

## D3 — `break` welding in; `specialOut` out

**Context.** `FtileFactoryDelegatorWhile#createWhile`
(`vcompact/FtileFactoryDelegatorWhile.java:95-120`): for every
`WeldingPoint` of the body (each `FtileBreak`), one snake from the break's
translated origin `(tr1.dx, tr1.dy)` left to `(hexagonHalfSize, tr1.dy)`
with `asToLeft`, appended AFTER the tile's own conns. 9 loop fixtures have
a `break`. `InstructionWhile.specialOut` is set only by
`InstructionWhile#setSpecial` (`InstructionWhile.java:189-191`), which has
NO caller in the tree (`grep -rn 'setSpecial(' activitydiagram3/` finds
only `InstructionIf`/`InstructionSwitch` setting their OWN field), so
`ConnectionOutSpecial` and `xDeltaBecauseSpecial` are dead paths.

**Decision.** Port the welding: the while walker records the origin of
every `break` node emitted while walking its body (the analogue of
`Genealogy.getTranslate`) and pushes the welding edges last. Treat
`specialOut` as null everywhere; journal the grep. Stop 12 if a fixture
disproves it.

**Consequences.** Break fixtures gain one line + arrowhead per break; no
`specialOut` code is written.

## D4 — Spare-height centring verbatim; compression untouched

**Context.** While: `height = geo.h + 4*12 + back1LabelH`
(`FtileWhile.java:585`), body at `y = d1.h + (total.h - d1.h - body.h -
labelH)/2` (`:626-629`). Repeat: `height = d1.h + repeat.h + d2.h + 8*12`
(`FtileRepeat.java:713-714`), body at `y = d1.h + space/2`, `space =
total.h - d1.h - d2.h - repeat.h` (`:735-739`), `diamond2` at `total.h -
d2.h` (`:762`). Ours stacks with `NODE_MARGIN_Y`. Klimt compression
(`layout/compress/`) then removes empty vertical bands in both.

**Decision.** Port the arithmetic verbatim inside `GtileWhile`/
`GtileRepeat`; `NODE_MARGIN_Y` leaves the loop path; `compress-geometry.ts`
is not touched (stop 14).

**Consequences.** `y1bis = max(y1, bottom) + 12` and the diamond2 y land
where the jar's do; every loop fixture's y moves and the compressor decides
the final gaps.

## D5 — Repeat back-edge selection ported verbatim; `Complex1` is a stop

**Context.** `FtileRepeat.create` (`:186-199`): `backward != null` ->
`ConnectionBackBackward1+2`; else `swimlane == null || swimlane ==
swimlaneOut` -> `ConnectionBackSimple1` when `swimlane != null &&
swimlane.isSmallerThanAllOthers(repeat.getSwimlanes())`, else
`ConnectionBackSimple2`; else `ConnectionBackComplex1`. `Simple2`
(`:608-660`, the no-lane default) runs from diamond2's RIGHT side at
mid-height to `xmax = dimTotal.getWidth() - 12`, up to diamond1's
mid-height, left into diamond1's RIGHT side (`asToLeft`,
`emphasizeDirection(UP)`, label `tbback`). `Simple1` (`:537-607`) goes
LEFT to `xmin = -12`, outside the tile's own box, `asToRight`. Ours always
goes left at x=0 from the condition's south to the body's north; awrl's D2
("the simple repeat back edge goes left") was wrong — golden
`biguku-39-voxu233` has the back edge at x=275.25 on the right, entering
the entry diamond's right side at (151.625, 67).

**Decision.** Port the chain; reuse `isMainLaneSmallerThanAllOthers`
(`layout/conditional-builder.ts:243`, `Swimlane.java:130-137`) exported
from there (or moved to a shared module), fed the lanes the body touches.
`Complex1` -> stop 11 and file. `backward` -> awrl T2's stacking stays.

**Consequences.** The default repeat flips to the right side into the entry
tile's right edge; laned fixtures may hit stop 11.

**Amendment 2026-09-16 (human decision, option 1 of `stop-11-complex1.md`).**
Six baseline fixtures reach `ConnectionBackComplex1` (`becanu`, `givanu`,
`kasadu`, `kudedo`, `mafete`, `manata`: `swimlane != swimlaneOut`), so
"unreachable" was false. T6 ports `Complex1` (`FtileRepeat.java:333-404`,
`drawSnake` `:364-402`) alongside `Simple1`/`Simple2`; stop 11 is retired.
Only the `drawU` shapes are in scope; the `drawTranslate` lane variants stay
the filed follow-on (`activity-loop-lane-translate`).

## D6 — Hooks stay `(left, inY)/(left, outY)`; the exit path is drawn inside the tile

**Context.** Both tiles' `pointOut` is `(left, height)` (`FtileWhile.java:
591-593`, `FtileRepeat.java:696-699`). While `ConnectionOut`
(`FtileWhile.java:465-512`): from the diamond's LEFT side at mid-height
`(d1.x, d1.y + inY + (outY - inY)/2)` left to `x = 12`, down to `y =
total.h`, then a SECOND snake (no arrowhead) right to `x = total.left`.
While `ConnectionBackSimple` (`:217-273`): body pointOut down to `y1bis =
max(y1, bodyBottom) + 12`, right to `xx = dimTotal.getWidth()`, up to the
diamond's mid-height, left to `x2 = d1.x + d1.w` (arrow `asToLeft`,
`emphasizeDirection(UP)`, label `back1` `VerticalAlignment.BOTTOM`;
`UEmpty(5, 12)` at `(x1, y1bis)`, `:272`). `ConnectionIn` (`:171-196`):
diamond pointOut -> body pointIn, straight. Repeat `ConnectionIn`
(`FtileRepeat.java:221-274`): entry pointOut -> body pointIn with a dog-leg
at mid-y when x differs; `ConnectionOut` (`:275-332`): body pointOut ->
diamond2 pointIn, skipped when the body has no pointOut. Ours emits no exit
path (the parent starts at `SOUTH_HOOK`) and lands the while back edge on
the header's north.

**Decision.** Keep `SOUTH_HOOK = (left, height)`; the walkers emit each
snake as an explicit point list with `emphasize: 'up'` on the back edges'
vertical and `arrowhead: false` on the while exit's second snake
(`Worm.java:161-168`); labels at the jar's anchors; every `UEmpty(5, 12)`
site becomes a reservation in `hexagon-reservations.ts`.

**Consequences.** The parent's connector is unchanged; loop fixtures gain
the jar's line/polygon counts.

## D7 — Draw order: `In`, `Back*`, `Out`, then break weldings

**Context.** `FtileWhile.java:151-168` and `FtileRepeat.java:173-203` add
conns in that order; weldings are appended by `FtileUtils.addConnection`
after (`FtileFactoryDelegatorWhile.java:103`). aedo's rule: a compound's
nodes, then its own edges.

**Decision.** Emit in that order. **Consequences.** No reorder risers
beyond the added elements.

## D8 — Retire only what has no live reader; `layout.old.ts` untouched

**Decision.** `BACK_EDGE_MARGIN`, `backEdgeRightX`, `backEdgeLeftX`,
`GConnectionVerticalDownThenBack`, `GConnectionDownThenUp` go when `grep`
shows no reader outside `layout.old.ts` (the dead engine, stop 10).

## D9 — Exit signal

**Decision.** `--align` per-tag equality on the representative slugs, the
diagonal scan at 0, byte-diff movers within `fixtures.md` (+ named parent
re-centres), zero unexplained rises grouped by class, one re-pin at T7. The
aggregate is reported, never gated (`compare.ts:404` is magnitude-blind and
anti-monotone under element growth).

## D10 — Pure-move before edit

**Decision.** T5 first moves the `'gtile-repeat'` case of
`tile-coordinates.ts` (394 lines) into `layout/walk-repeat.ts` unchanged
(precedent `walk-while-branch.ts`), commits, then edits; T2's shared label
helper is `layout/diamond-labels.ts`.
