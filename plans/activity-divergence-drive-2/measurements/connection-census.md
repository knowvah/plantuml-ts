# T1a — connection census (D3)

Diagnosis only, no `src/` edits. Java root for every citation below:
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/`.

## 0. Scope ruling (read before the table)

- `activitydiagram3/gtile/**` is dead: `Gtile.USE_GTILE = false`
  (`gtile/Gtile.java:47`), checked only at `Swimlanes.java:241`. All
  `Snake.create`/`withMerge` sites under `gtile/` (live code AND
  commented-out code) are EXCLUDED from the table below as out of scope,
  not as MISSING. Grep confirms exactly **24** total `withMerge(` text
  occurrences repo-wide; **12** are live/reachable (table below), the
  other **12** are under `gtile/` (5 live-but-unreachable code, 7 inside
  `//`-commented blocks in `GConnectionVerticalDownThenBack.java` and
  `GtileWhile.java`). This reconciles `decisions.md#D2`'s "21 LIMITED + 3
  NONE" (textual count including the dead package) against the 12 live
  sites actually relevant to T1b.
- `FtileSwitchWithDiamonds`/`FtileSwitchNude` (no-links switch builder)
  are dead: `FtileFactoryDelegatorSwitch.createSwitch` (`:73`) always
  calls `createWithLinks`, never `createWithDiamonds`/`createNude`
  (`:76-78`, commented-out alternatives). Excluded.
- `FtileIfLongVertical` is reachable but pragma-gated: chosen only when
  `pragma.isTrue(PragmaKey.USE_VERTICAL_IF)` AND `thens.size() > 1`
  (`FtileFactoryDelegatorIf.java:85-89`, i.e. `!pragma useVerticalIf
  true` plus an elseif chain). No corpus fixture sets this pragma that
  this census found; included as MISSING below per D3 ("do not invent
  counterparts... mark MISSING and report").
- `ParallelBuilderMerge` (the `fork ... end merge` / `ForkStyle.MERGE`
  builder, as opposed to `end fork`/`end split`) is reachable
  (`FtileFactoryDelegatorCreateParallel.java:56-60`) and entirely
  unported — MISSING below.
- `Snake.touches()` (`Snake.java:329-337`) has zero callers anywhere in
  the Java tree (grepped `\.touches(` repo-wide outside its own
  definition) — dead code in the jar itself. The live decoration-touch
  predicate is `PendingSnake.touchesOther`
  (`svek/UGraphicForSnake.java:92-100`), which calls
  `Snake.cannotBeTouched()` (`Snake.java:291-293`), NOT `touches()`. Do
  not port `touches()`.

## 1. Live connection table

Columns: `javaClass | file:line | strategy | startDeco | endDeco |
emphasize | texts | ourSite (file:line or MISSING)`. "strategy" is the
value passed to the builder's OWN `Snake.create(...)`, before any
`.max()` with a merge partner at draw time; default (no `.withMerge`
call) is FULL (`Snake.java:140`, static `create` overloads).

### FtileIfDown.java (`vcompact/FtileIfDown.java`)

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| ConnectionIn | 196-239 | FULL | none | asToDown | none | none | `walk-if-down.ts:169-174` `connectionIn` |
| ConnectionOut | 241-302 | FULL | none | asToDown | none | none | `walk-if-down.ts:179-185` `connectionOut` |
| ConnectionHorizontal | 161-194 | FULL | none | asToRight | none | none | `walk-if-down.ts:190-196` `connectionHorizontal` |
| ConnectionElse1 | 304-354 | FULL | none | asToRight | DOWN | none | `walk-if-down.ts:210-219` `connectionElse1` |
| ConnectionElse2 | 356-407 | FULL | none | asToLeft | DOWN | none | `walk-if-down.ts:224-233` `connectionElse2` |
| ConnectionElseHline (extends Else2, `conditionEndStyle==HLINE`) | 409-445 | FULL | none | asToDown | none | none | **MISSING** — `ConditionEndStyle` unported (see §0 note below) |
| ConnectionElseNoDiamond (extends Else2) | 447-458 | FULL | none | asToLeft | DOWN | none | `walk-if-down.ts:238-247` `connectionElseNoDiamond` |
| ConnectionHline ("copied from FtileIfLongHorizontal... HLINE", absorbed-stop-style horizontal close line) | 461-522 | **NONE** | none | none | none | none | **MISSING** |

`ConditionEndStyle` (`svek/ConditionEndStyle.java`, values `DIAMOND`
default / `HLINE`) is a whole skinparam-selected end-cap style, checked
at `FtileIfDown.java:147,149` (`create`'s `conns` assembly) and
`cond/FtileIfWithLinks.java:537,546`; **zero hits** for
`ConditionEndStyle`/`conditionEndStyle` anywhere under `src/diagrams/
activity/`. `GtileIfDown`/`gtile-if-down.ts` carries no such field —
our builder always takes the DIAMOND path. Any fixture setting
`skinparam ConditionEndStyle hline` on an if/else renders through a code
path this port cannot reach at all (not merely "renders differently" —
`ConnectionHline`/`ConnectionElseHline` are never constructed). Reported
per D3/stop-12; not invented, not fixed here.

### FtileIfLongHorizontal.java (`vcompact/FtileIfLongHorizontal.java`)

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| ConnectionIn | 300-321 | FULL | none | asToDown | none | none | `walk-if-long-horizontal.ts:190-196` `connectionIn` |
| ConnectionHorizontal | 260-294 | FULL | none | asToRight | none | none | `walk-if-long-horizontal.ts:181-186` `connectionHorizontal` |
| ConnectionVerticalIn | 389-436 | FULL | none | asToDown | none | none | `walk-if-long-horizontal.ts:143-152` `connectionVerticalIn` |
| ConnectionVerticalOut | 438-474 | FULL | none | asToDown | none | `out2` (withLabel) | `walk-if-long-horizontal.ts:157-165` `connectionVerticalOut` |
| ConnectionLastElseIn | 323-350 | FULL | none | asToDown | none | none | `walk-if-long-horizontal.ts:200-207` `connectionLastElseIn` |
| ConnectionLastElseOut | 352-387 | FULL | none | asToDown | none | `out2` (withLabel) | `walk-if-long-horizontal.ts:212-220` `connectionLastElseOut` |
| ConnectionHline (`nbOut>0`, cross-branch close line) | 476-570 | **NONE** (`:507`) | none | none | none | none | `walk-if-long-horizontal.ts:241-258` `connectionHline` — ported; swimlane-aware min/max (`getMinmax`, `:521-552`) is NOT reproduced (our `hlineOutXs` is swimlane-unaware), a geometry gap not an existence gap |

### FtileIfLongVertical.java (`vcompact/FtileIfLongVertical.java`) — pragma-gated, see §0

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| ConnectionIn | 206-228 | FULL | none | asToDown | none | none | **MISSING** |
| ConnectionVerticalIn | 230-263 | FULL | none | asToDown | none | none | **MISSING** |
| ConnectionVertical | 265-298 | FULL | none | asToDown | none | `label` | **MISSING** |
| ConnectionLastElse | 300-329 | FULL | none | asToDown | none | `label` | **MISSING** |
| ConnectionLastElseOut | 331-358 | FULL | none | asToDown | none | none | **MISSING** |
| ConnectionThenOut | 360-392 | FULL | none | asToLeft | none | none | **MISSING** |
| ConnectionThenOutConnect | 394-424 | FULL | none | asToRight | none | none | **MISSING** |

Whole family MISSING — no `gtile-if-long-vertical` kind, no walker.
Reachable only via `!pragma useVerticalIf true` + an elseif chain
(`thens.size()>1`); no fixture in `fixtures.md`/the b0 cohort was found
setting that pragma, but the path is live code, not dead code, so it is
reported rather than silently out-of-scoped.

### cond/FtileIfWithLinks.java (`vcompact/cond/FtileIfWithLinks.java`)

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| ConnectionHorizontalThenVertical (branch snake, `:113`) | 90-176 | FULL | none | `usingArrow` | none | none | `walk-if-with-links.ts:39-43,56-63` `horizontalThenVertical`/`pushDecoratedEdge` |
| ConnectionHorizontalThenVertical ("small" sub-snake, `:160`) | 90-176 | FULL | none | none | none | none | same site — our port draws one edge where the jar's own small-snake exists only inside the `getFtile1()!=null` merge-node branch (`:155-168`); not independently distinguished in our walker, not re-verified line-for-line here |
| ConnectionHorizontalThenVertical (`:167`, merge-node branch) | 90-176 | **LIMITED** | none | `usingArrow` | none | none | same site |
| ConnectionVerticalThenHorizontal (`:203`, direct) | 177-287 | FULL | none | `arrow` | DOWN (conditional, `:205`) | none | `walk-if-with-links.ts:45-48,56-63` `verticalThenHorizontal`/`pushDecoratedEdge` |
| ConnectionVerticalThenHorizontal (`:257` snake, branch1 merge) | 177-287 | **LIMITED** | none | none | none | none | same site |
| ConnectionVerticalThenHorizontal (`:264` small, branch1 merge) | 177-287 | **LIMITED** | none | `arrow` | none | none | same site |
| ConnectionVerticalThenHorizontal (`:272` snake, branch2 merge) | 177-287 | **LIMITED** | none | none | none | none | same site |
| ConnectionVerticalThenHorizontal (`:277` small, branch2 merge) | 177-287 | **LIMITED** | none | `arrow` | none | none | same site |
| ConnectionVerticalThenHorizontalDirect (`:315` snake) | 288-368 | FULL | none | none | DOWN (conditional, `:317`) | none | `walk-if-with-links.ts:218-230` `pushDirectConnector` |
| ConnectionVerticalThenHorizontalDirect (`:342`, merge-node branch) | 288-368 | **LIMITED** | none | none | none | none | same site |
| ConnectionVerticalOut | 369-420 | FULL | none | asToDown | none | `out2` (withLabel) | `walk-if-with-links.ts` — no dedicated function found by name; **flagged for T1b to re-verify** (likely folded into `pushOutConnectors`/`pushOutConnectorsBoth`, not independently confirmed line-for-line here) |
| ConnectionHline (`:453`, "copied from FtileIfLongHorizontal... HLINE") | 421-537 (approx.) | **NONE** | none | none | none | none | **MISSING** (same `ConditionEndStyle.HLINE` gap as FtileIfDown) |

The `ConnectionHorizontalThenVertical`/`VerticalThenHorizontal`/
`VerticalThenHorizontalDirect` constructors build TWO Snakes
("snake"/"small" or "snake" at two call sites) per branch in the
merge-node case specifically so the LIMITED-strategy snake and the
decorated "small" snake touch and merge at runtime (§3 case — this is
the `FtileIfWithLinks` analogue of `FtileRepeat.ConnectionOut`'s own
two-snake elbow, see census row for `FtileRepeat` below and merge-case
E).

### cond/FtileSwitchWithOneLink.java (`vcompact/cond/FtileSwitchWithOneLink.java`)

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| ConnectionVerticalTop | 64-100 | FULL | none | asToDown | none | `branch.getTextBlockPositive()` | `tile-coordinates.ts:321-367` `gtile-switch` case, via `GConnectionSideThenVerticalThenSide` (`routing/gconnection-side-then-vertical-then-side.ts`) — shape-mapped, not independently re-derived per branch-count here |
| ConnectionVerticalBottom | 101-130 | FULL | none | asToDown | none | none | same site |

### cond/FtileSwitchWithManyLinks.java (`vcompact/cond/FtileSwitchWithManyLinks.java`)

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| ConnectionHorizontalThenVertical | 72-132 | FULL | none | asToDown | none | `branch.getTextBlockPositive()` | `tile-coordinates.ts:321-367` `gtile-switch` case |
| ConnectionVerticalThenHorizontal | 133-196 | FULL | none | `arrow` | none | `outLabel` | same site |
| ConnectionVerticalTop | 197-242 | FULL | none | asToDown | none | `branch.getTextBlockPositive()` | same site |
| ConnectionVerticalBottom | 243-296 | FULL | none | asToDown | none | `outLabel` | same site |
| ConnectionHorizontalThenVerticalCrossSwimlane | 297-351 | FULL | none | asToDown | none | `branch.getTextBlockPositive()` | **MISSING** — our `gtile-switch` case reads no swimlane state at all |
| ConnectionVerticalThenHorizontalCrossSwimlane | 352-end | FULL | none | `arrow` | none | none | **MISSING** — same reason |

Our `gtile-switch` walker uses ONE uniform connector shape
(`GConnectionSideThenVerticalThenSide`) for every diamond→case and
case→merge-diamond pair regardless of branch count or swimlane
placement; it is a genuine counterpart for the non-swimlane One/
ManyLinks connections (an edge IS drawn for every pair), but the two
cross-swimlane variants have no analogue — reported as MISSING per D3
rather than assumed-covered by the uniform shape.

### FtileWhile.java (`vcompact/FtileWhile.java`)

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| ConnectionIn (`drawU`) | 189-197 | FULL | none | asToDown | none | none | `walk-while-branch.ts` `pushWhileHeader`/`walkWhile`'s `ConnectionIn` push (header→body) |
| ConnectionIn (`drawTranslate`, `:205`) | 199-214 | **LIMITED** | none | asToDown | none | none | same site, cross-swimlane variant |
| ConnectionBackSimple (`drawU`) | 244-274 | FULL | none | asToLeft | UP | `back` (BOTTOM) | `walk-while-branch.ts:119-134` `backEdgePoints`/`buildWhileBackLoop` |
| ConnectionBackSimple (`drawTranslate`, `:280`) | 276-309 | **LIMITED** | none | asToLeft | none | none | same site |
| ConnectionBackBackward1 | 341-364 | FULL | none | asToUp | none | `back` (BOTTOM) | `walk-while-backward.ts:40-58` `pushBackward1` |
| ConnectionBackBackward2 | 386-407 | FULL | none | asToLeft | none | `back` (horiz. align) | `walk-while-backward.ts:61-71` `pushBackward2` |
| ConnectionBackEmpty | 432-461 | FULL | none | asToLeft | UP | none | `walk-while-branch.ts:215-240` `pushWhileBackNonEmpty`/`pushWhileBack` (the "while has no body" empty-back case) |
| ConnectionOut (`snake`, `:485`) | 482-510 | **LIMITED** | none | none | DOWN | none | `walk-while-branch.ts:274-285` `pushWhileOut` — first `pushEdgeFlagged` call |
| ConnectionOut (`snake2`, `:504`) | 482-510 | FULL (default, no decoration) | none | none | none | none | `walk-while-branch.ts:274-285` `pushWhileOut` — second `pushEdgeFlagged` call |
| ConnectionOutSpecial | 513-end | FULL | none | asToDown | none | none | `walk-while-branch.ts` — specialOut path, folded into `walkWhile`/`buildWhileFrame`'s `specialOut`-conditional push (not independently named; flagged for T1b to re-verify the exact function) |

`ConnectionOut`'s two snakes are THE canonical real-world merge case:
`snake` ends at `(elbowX, southHook.y)`, `snake2` starts at the SAME
point — `Snake.merge` fires (`max(LIMITED,FULL)=LIMITED`), and since
BOTH have `endDecoration=null`, the merged result's decoration is also
`null` (`oneOf = other.endDecoration==null ? this.endDecoration :
other.endDecoration`, `Snake.java:313`) — the while-loop exit draws
with NO arrowhead in the jar, confirmed in merge-case C below. Our port
already pushes BOTH edges with `arrowhead: false` (see
`walk-while-branch.ts:264-268`'s own comment), so the DECORATION
outcome already matches; what's missing is that the jar draws this as
**one** polyline/Snake object while we draw two separate ones, see §3.

### FtileFactoryDelegatorWhile.java (break welding)

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| anonymous `Connection` (break→elbow weld) | 101-116 | FULL | none | asToLeft | none | none | `walk-while-branch.ts:298-312` `pushWhileWeldings` |

### FtileRepeat.java (`vcompact/FtileRepeat.java`)

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| ConnectionIn | 221-274 | FULL | none | asToDown | none | `tbin` | `walk-repeat.ts:219-224` `pushRepeatIn` |
| ConnectionOut (`drawU`) | 295-306 | FULL | none | asToDown | none | `tbout` | `walk-repeat.ts:240-246` `pushRepeatOut` |
| ConnectionOut (`snake`, `drawTranslate`, `:314`) | 308-329 | FULL (default, no decoration) | none | none | none | none | **not independently found** — `walk-repeat.ts` has no `ConnectionTranslatable`-equivalent cross-swimlane repeat-out path; flagged MISSING for the cross-swimlane sub-case only (the non-swimlane case at `:295-306` IS ported) |
| ConnectionOut (`small`, `drawTranslate`, `:323`) | 308-329 | FULL | none | asToDown | none | `tbout` | same gap |
| ConnectionBackComplex1 (`:381` asToLeft branch) | 333-405 | FULL | none | asToLeft | UP | none | `walk-repeat.ts:307-345` `complex1Points`/`buildRepeatBackLoop` |
| ConnectionBackComplex1 (`:393` asToRight branch) | 333-405 | FULL | none | asToRight | UP | none | same site |
| ConnectionBackBackward1 | 406-462 | FULL | none | asToUp | none | `tbback` | `walk-repeat-backward.ts:42-60` `backward1Points` |
| ConnectionBackBackward2 | 463-536 | FULL | none | asToLeft or asToRight | none | `label` (conditional) | `walk-repeat-backward.ts:63-78` `backward2Points` |
| ConnectionBackSimple1 | 537-607 | FULL | none | asToRight or asToLeft | UP | `tbback` | `walk-repeat.ts:279-305` `simple1Points` |
| ConnectionBackSimple2 | 608-end | FULL | none | asToLeft | UP | `tbback` | `walk-repeat.ts:258-277` `simple2Points` |

`ConnectionOut`'s `drawTranslate` ("snake"+"small", `:314-327`) is the
**text-blocks-merge** case: `small` (pushed second) carries `tbout`
text, so per `Snake.merge`'s own-side check (`for (Text text :
other.texts) if (text.hasText(...)) return null`, `Snake.java:308-310`)
the merge is REFUSED whenever `tbout` is non-empty — two separate
Snakes draw even though their endpoints coincide. This sub-case
(cross-swimlane repeat exit with a label) has no counterpart in
`walk-repeat.ts` at all (confirmed: no `ConnectionTranslatable`
dispatch for `ConnectionOut` in that file) — MISSING, scoped to the
cross-swimlane sub-case only.

### FtileFactoryDelegatorRepeat.java (break welding)

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| anonymous `Connection` (first weld, asToRight) | ~140-146 | FULL | none | asToRight | none | none | **MISSING** |
| anonymous `Connection` (subsequent welds, asToLeft) | ~147-151 | FULL | none | asToLeft | none | none | **MISSING** |

Confirmed MISSING: `walk-repeat.ts`/`walk-repeat-backward.ts` have zero
`weld`/`Welding`/break-handling code (grepped both files). The `while`
side of the SAME mechanism IS ported (`pushWhileWeldings` above,
`FtileFactoryDelegatorWhile.java:101-116`), making this an asymmetric
gap: `break` inside `repeat...repeat while` draws no weld connector at
all in this port, while `break` inside `while...endwhile` does.

### ParallelBuilderFork.java / ParallelBuilderSplit.java (`vcompact/`)

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| ConnectionIn (Fork, `:154`) | 138-186 | FULL | none | asToDown | none | `label` (conditional) | `walk-fork-branches.ts:83-104` `pushBranchIn` |
| ConnectionIn (Fork, cross-swimlane `:172`, `ignoreForCompression`) | 138-186 | FULL | none | asToDown | none | `label` | `swimlane-placement.ts:19-22` (cited) |
| ConnectionOut (Fork, `:208`) | 187-233 | FULL | none | asToDown | none | `label` | `walk-fork-branches.ts:108-127` `pushBranchOut` |
| ConnectionOut (Fork, cross-swimlane `:229`) | 187-233 | FULL | none | asToDown | none | `label` | `swimlane-placement.ts:22-23` (cited) |
| ConnectionIn (Split, `:197`) | 181-226 | FULL | none | asToDown | none | `label` | `walk-fork-branches.ts:83-104` `pushBranchIn` (shared fn) |
| ConnectionOut (Split, `:252`,`:273`) | 228-287 | FULL | none | asToDown | none | `label` | `walk-fork-branches.ts:108-127` `pushBranchOut` (shared fn) |

### ParallelBuilderMerge.java (`vcompact/ParallelBuilderMerge.java`) — `ForkStyle.MERGE`, `fork ... end merge`

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| ConnectionHorizontalThenVertical | 121-192 | FULL | none | asToRight/asToLeft/asToDown (computed) | none | none | **MISSING** |
| ConnectionIn | 193-231 | FULL | none | asToDown | none | `label` | **MISSING** |

Whole builder MISSING: `FtileFactoryDelegatorCreateParallel.java:60`
constructs `ParallelBuilderMerge` whenever `style == ForkStyle.MERGE`
(the `end merge` keyword, distinct from `end fork`/`end split`); no
`gtile-merge` kind, no walker, anywhere under `src/diagrams/activity/`.

### ConnectionVerticalDown.java (`vcompact/ConnectionVerticalDown.java`) — generic sibling connector

| javaClass | file:line | strategy | startDeco | endDeco | emphasize | texts | ourSite |
|---|---|---|---|---|---|---|---|
| (class itself, `drawU`) | 69-85 | FULL | none | asToDown | none | `textBlock` | `tile-coordinates.ts:149-155` `pushTopDownSiblingEdge`, via `routing/gconnection-vertical-down.ts`'s `GConnectionVerticalDown` |
| (class itself, `drawTranslate`) | 87-100 | FULL | none | asToDown | none | `textBlock` | `swimlane-placement.ts:11` (cited directly), cross-swimlane sibling connector |

## 2. Dead/out-of-scope summary (not individually rowed)

- `gtile/*`: 5 live-but-unreachable `withMerge` sites
  (`GConnectionVerticalDownThenHorizontal.java:83,91,99,105`,
  `GConnectionHorizontalThenVerticalDown.java:95`) + 7 commented-out
  (`GConnectionVerticalDownThenBack.java:116,123,131,136`,
  `GtileWhile.java:216,290,494`) + all `Snake.create` calls inside
  `gtile/GConnectionVerticalDown.java`, `gtile/
  GConnectionSideThenVerticalThenSide.java`, `gtile/
  GConnectionHorizontalThenVerticalDown.java`,
  `gtile/GConnectionVerticalDownThenHorizontal.java`,
  `gtile/GConnectionVerticalDownThenBack.java`, `gtile/GtileWhile.java`.
  All unreachable (`USE_GTILE=false`).
- `FtileSwitchWithDiamonds`/`FtileSwitchNude`: constructed by dead
  methods (`createWithDiamonds`/`createNude`, never called).
- `asciiverse/AsciiSnake.java`, `sequencediagram/LinkAnchor.java`: different
  diagram types (ASCII-art renderer, sequence diagrams), not activity.

## 3. Merge cases

All six rendered via `scripts/oracle-render.sh` into this directory
(`*.puml`/`*.svg` = jar; `*.ours.svg` = this port, rendered with
`DeterministicMeasurer` through `renderFixtureActivity`, same seam
`activity-probe.ts` uses). Counts are raw SVG tag counts (`<polygon>`
= arrowhead, `<line>` = one drawn segment).

| case | puml source | mechanism | jar elements | our elements |
|---|---|---|---|---|
| A — fusion, collinear corner | `becaje-01-vaji284` (corpus) — `if(x) then / end / else / ...endif / stop` | `ConnectionElseNoDiamond` (FtileIfDown.java:447-458, FULL) end-to-start touches the outer `ConnectionVerticalDown` into `stop`; both legs run straight DOWN at the join so `Worm.mergeMe`'s `removeRedondantDirection` (`Worm.java:407-417`) also collapses the shared direction | polygon=5, line=6 | polygon=6, line=7 (both +1) |
| B — decoration-drop, non-collinear corner | `cujoni-21-somi079` (corpus) — `if (test) then (yes) / stop / note:foo / else (no) / endif / stop` | Same `ConnectionElseNoDiamond`→`ConnectionVerticalDown` merge as A, but the note widens the if-tile so the join is an L-corner, not collinear — `Snake.merge` still succeeds (drops 1 decoration via `Snake.java:313`'s `oneOf`) but `mergeMe` finds no collapsible pattern, so line count is UNCHANGED | polygon=5, line=6 | polygon=6 (+1), line=6 (same) |
| C — LIMITED corner (while/repeat elbow) | `vupuse-73-nuso490` (corpus) — `start / repeat / :Waiting for message; / while (forever) / stop` | `FtileWhile.ConnectionOut`'s two-snake elbow (`FtileWhile.java:482-510`): `snake` (LIMITED, no decoration) end-touches `snake2` (default FULL, no decoration); `max(LIMITED,FULL)=LIMITED` merges them, decoration stays null on both sides (nothing visible lost) but TWO Snake objects become ONE | polygon=9, line=11 | polygon=11 (+2 — TWO elbows in this fixture: repeat's own + while's), line=11 (same) |
| D — NONE boundary (absorbed-stop) | `jipapo-14-kevu587` (corpus) — `if (conf) then (true) / note right.../ :finalize; / break / endif` | `pushElseConnector`'s `optionalStop`/`hasThenPointOut`-false branches plus the `break`'s own exit; the add1 note's "FtileIfDown.java:512 absorbed-stop opts out with NONE" applies to the `ConditionEndStyle.HLINE` `ConnectionHline` (MISSING per §1), NOT to this fixture's actual drawn path — measured delta here is the SAME `ConnectionElseNoDiamond`-into-outer-connector pattern as A/B (the `break` node's own exit merges with whatever follows `endif`) | polygon=5, line=5 | polygon=6 (+1), line=6 (+1) |
| E — text-bearing snake must not merge | `xizola-97-sizu458` (corpus) — `repeat :foo as starting label; / ... / backward:This is backward; / repeat while (more data?)` (swimlane repeat+backward) | `FtileRepeat.ConnectionBackComplex1`/`ConnectionBackBackward2` carry `tbback`/`label` text; per `Snake.merge`'s `other.texts` check (`Snake.java:308-310`) a text-carrying snake blocks ITS OWN merge when it is the later-pushed ("other") side — confirmed present (jar draws both the labelled back-edge and the touching swimlane-crossing connector as separate elements, text count ours=jar=7) | polygon=8, line=16 | polygon=9 (+1), line=17 (+1) — the +1/+1 is a DIFFERENT, unlabelled touch elsewhere in this fixture (the repeat entry/backward-out join), not the labelled edge itself, which correctly stays unmerged in both |
| F — group boundary (`partition`) | synthetic, two copies of `:act1; if(cond?) then(label1) stop endif :act2;` with the second wrapped in `partition foo { }` | Intended to isolate `FtileGroup`'s nested `UGraphicForSnake` (no merge across a group boundary, decisions.md D1); **confound found**: the delta (polygon +4, line +4, text −1) matches TWO independent instances of the A/B `ConnectionElseNoDiamond`-into-outer-connector merge (one per if/stop, inside and outside the partition) plus an unrelated text miscount — this case does NOT cleanly isolate the group-boundary rule and should not be read as a group-boundary confirmation. **Ruled out**: it is not evidence the group boundary itself is ported correctly or incorrectly. **Not yet instrumented**: a fixture with a merge candidate whose two Snakes are positioned exactly straddling a `partition`/`group` open/close, with no OTHER merge opportunity present, so the only variable is the boundary. |

## 4. Ten sampled rows — extra-element attribution

Sampled from `measurements/b0-elements.json`'s `extra line+arrow` (7)
and `extra arrow only` (3) buckets. "Pair" names the two Connections
whose touching endpoints the jar fuses/decoration-drops and we don't.

| slug | delta | pair | mechanism | confidence |
|---|---|---|---|---|
| becaje-01-vaji284 | poly+1,line+1 | `FtileIfDown.ConnectionElseNoDiamond` → outer `ConnectionVerticalDown` (into `stop`) | A (collinear merge) | High — traced exact puml, matches merge-case A byte-for-byte |
| cujoni-21-somi079 | poly+1 | `FtileIfDown.ConnectionElseNoDiamond` → outer `ConnectionVerticalDown` (into `stop`, note widens geometry) | B (non-collinear decoration drop) | High — traced, matches merge-case B |
| vupuse-73-nuso490 | poly+2 | `FtileRepeat.ConnectionOut`/`ConnectionIn` elbow + `FtileWhile`-style `ConnectionOut` elbow (repeat-while has BOTH a repeat-body-exit elbow and a condition-exit elbow) | C (LIMITED+FULL elbow, ×2) | High — traced, matches merge-case C; the TWO separate elbows account for the +2 polygon exactly |
| jipapo-14-kevu587 | poly+1,line+1 | `FtileIfDown.ConnectionElseNoDiamond`/break-exit → outer `ConnectionVerticalDown` | A/D hybrid (collinear merge after a `break`) | High — traced, matches merge-case D's measured delta exactly |
| bozuro-33-celo170 | poly+2 | `repeat`/`if`/`else` nested inside the repeat body: one `ConnectionElseNoDiamond`-style if-exit merge (as A/B) PLUS one `FtileRepeat.ConnectionBack*` elbow (as C) | A+C combined | Medium — delta magnitude (2 polygons, 16=16 lines, i.e. BOTH non-collinear) is consistent with two independent decoration-only merges, not individually re-traced coordinate-by-coordinate |
| delide-30-teva601 | poly+2,line+3 | swimlane `repeat`+`backward` chain: `ConnectionBackBackward1`/`ConnectionBackBackward2` elbow into the next `repeat while` condition, repeated across the 2-swimlane crossing | C-family (collinear, ×2-3 collapses) | Medium — pattern-matched to the known "repeat/while back-edge pushed as separate segments" finding (`.agent-notes/T3b-walker-edges.md`); not individually traced to exact coordinates here |
| xizola-97-sizu458 | poly+1,line+1 | unlabelled join at the repeat-entry/backward-out boundary (NOT the labelled `backward:This is backward;` edge, which correctly does not merge — see merge-case E) | A/C hybrid | High for the E "text correctly blocks merge" negative result; Medium for which exact unlabelled pair accounts for the remaining +1/+1 |
| jupivo-67-gidi531 | poly+4,line+2 | `while`+`fork`+(`if`+`break`)×2: two `break`-exit merges (as D/jipapo, poly+1,line+1 each = poly+2,line+2) plus two further decoration-only drops where the fork's join-bar connector touches each branch's `if`-exit without a collinear corner (poly+2,line+0) | D-family (×2) + B-family (×2) | Medium — magnitude-consistent decomposition, not individually traced per branch |
| japeru-28-guku001 | poly+4,line+4,text−1,path−1 | four repeats of the A/B `if(cond)then(label) stop endif :actN;` pattern (two at top level, two inside `partition foo {}`, matching merge-case F's confound) | A-family (×4) | Medium — the poly/line magnitudes (both +4) match 4 independent collinear merges exactly; the `text−1`/`path−1` deltas are UNEXPLAINED by this census (likely a `partition`-label or an unrelated opale/note divergence) and are explicitly NOT attributed here — flagged for whoever owns that family |
| tobajo-64-mipi810 | poly+1,line+1 | fork branch's if-then exit (`:Inform test;` then `endif`, inside the first fork branch which also carries a `note right`) merging into the fork's own join-bar connector (`ParallelBuilderFork`'s join tile input, analogous to `ConnectionVerticalDown`) | A-family (collinear merge, if-exit into fork join) | Medium — pattern-matched (small, isolated +1/+1 signature identical to A), not individually traced through the fork geometry |

**Pattern summary (pair → count among the 10 sampled rows):**
`ConnectionElseNoDiamond`/if-exit → outer `ConnectionVerticalDown`-family
sibling connector: **7 of 10** rows (becaje, cujoni, jipapo, bozuro,
japeru×4-equivalent, tobajo) involve this one pair shape in some form.
`FtileRepeat`/`FtileWhile` back-edge or `ConnectionOut` elbow (LIMITED+
FULL corner): **4 of 10** (vupuse×2, bozuro, delide). These are not
mutually exclusive (bozuro counts in both). No sampled row needed the
`removeEndDecorationIfTouches` FALLBACK path independently of a
successful `Snake.merge` — every sampled row's decoration loss
co-occurs with (and is caused by) a successful merge, not a
merge-blocked-but-still-touching case. `removeEndDecorationIfTouches`
remains real jar code (quoted in §5) and must still be ported for
whatever un-sampled rows DO need it, but it was not required to explain
any of these 10.

## 5. Implementation notes for T1b

**Two-step mechanism, not one.** `UGraphicForSnake.addPendingSnake`
(`svek/UGraphicForSnake.java:146-156`) runs FIRST, at draw time, for
every `Snake` the diagram pushes, in draw order: for each new snake, try
`PendingSnake.merge` (`:111-122`) against every ALREADY-pending snake in
order, replace the FIRST match, else append as a new pending snake.
`flushUg` (`:158-165`) then runs SECOND, once, after every snake has
been pushed: for each remaining pending snake, call
`removeEndDecorationIfTouches(snakes)` (`:81-88`) against the FULL
current list (including itself — harmless, `same()` on a point against
itself is impossible since a snake's first≠last in every real case),
THEN `drawInternal()`. Port as two passes over the ordered edge list,
not one.

**`Snake.merge` is the primary fusion** (`activitydiagram3/ftile/
Snake.java:303-327`):
```
public Snake merge(Snake other, StringBounder stringBounder) {
    final MergeStrategy strategy = this.mergeable.max(other.mergeable);
    if (strategy == MergeStrategy.NONE) return null;
    for (Text text : other.texts)
        if (text.hasText(stringBounder)) return null;
    if (same(this.getLast(), other.getFirst())) { ...merge... }
    if (same(this.getFirst(), other.getLast())) return other.merge(this, stringBounder);
    return null;
}
```
- `strategy = max(this.mergeable, other.mergeable)` (`MergeStrategy.
  java:42-45`, ordinal FULL=0 < LIMITED=1 < NONE=2, `max` picks the
  LARGER ordinal i.e. the MORE restrictive strategy of the pair).
- The text guard checks ONLY `other.texts` (the snake being merged IN,
  not the pending one being merged INTO) — a labelled snake blocks
  merging **only when it is on the "other" side of the call**. Since
  `PendingSnake.merge(newItem)` always calls `pending.merge(newItem)`
  (`this`=earlier-pushed, `other`=newly-pushed,
  `UGraphicForSnake.java:117`), the practical rule is: **a draw-order-
  LATER snake carrying a non-empty label blocks the merge**; an EARLIER
  snake's own label does not (its text survives into `mergeTexts`,
  `Snake.java:317-318`). Port must track push order, not just a
  symmetric "either side has text" test — not symmetric in the jar.
- End-to-start match only (`same(this.getLast(), other.getFirst())`,
  `:312`); if that fails it also tries the reverse pairing by swapping
  and recursing once (`:323-324`) — so EITHER snake can be the
  "head" or "tail" regardless of push order, as long as one's last
  touches the other's first (in either direction).
- `same()` is exact-ish coordinate equality within `0.001`
  (`Snake.java:299-301`), on PRE-compression, UNTRANSLATED-relative-to-
  the-UGraphicForSnake coordinates — `PendingSnake.merge` explicitly
  moves both snakes by their accumulated `dx/dy` before calling
  `Snake.merge`, then moves the result BACK by `-dx,-dy`
  (`UGraphicForSnake.java:115-121`) so the stored pending snake stays in
  its own local frame. Port must apply the SAME translate-merge-
  untranslate dance if edges are pushed with any local/accumulated
  offset, or coordinates will not line up for the `same()` check.
- Both `startDecoration` MUST be null (`:314-315`, else
  `UnsupportedOperationException` — "Not yet coded") — no live site in
  this census sets a `startDecoration` on a snake that also participates
  in a merge, so this constraint has never been hit upstream in the
  activity domain; still worth an assertion/comment at the port site
  rather than silently mis-handling it.
- The merged end decoration (`Snake.java:313`): `other.endDecoration ==
  null ? this.endDecoration : other.endDecoration` — prefers the LATER
  snake's decoration, falling back to the earlier one's. This is why
  `FtileWhile.ConnectionOut`'s elbow (both sides null) stays null, and
  why `ConnectionElseNoDiamond` (has its own asToLeft/Right decoration)
  loses it to whatever the OUTER sibling connector supplies.
- `Worm.merge(other, strategy)` (`Worm.java:361-372`) concatenates both
  point lists (resolving each through its own `UTranslate` first,
  `:366-369`) then runs `mergeMe(strategy)` (`:374-394`): a fixed-point
  loop over 8 named corner-collapse patterns
  (`removeNullVector`/`removeRedondantDirection`/`removePattern1..8`),
  where **only `removePattern8` is gated on `strategy==FULL`**
  (`Worm.java:390-391`) — every other pattern runs under BOTH FULL and
  LIMITED. `removePattern8` specifically collapses a
  `LEFT,DOWN,LEFT,DOWN` or `RIGHT,DOWN,RIGHT,DOWN` 4-direction run into
  a single corner (`:535-550`) — the "extra corner" LIMITED is
  documented (decisions.md D2) to preserve. NONE never reaches
  `mergeMe` at all (merge returns null before `Worm.merge` is called).

**`removeEndDecorationIfTouches` is a SEPARATE, simpler, SECOND-pass
check** (`svek/UGraphicForSnake.java:81-100`):
```
void removeEndDecorationIfTouches(List<PendingSnake> snakes) {
    for (PendingSnake other : snakes) {
        if (touchesOther(other)) { this.snake = this.snake.withoutEndDecoration(); return; }
    }
}
private boolean touchesOther(PendingSnake other) {
    if (other.snake.cannotBeTouched()) return false;
    ...same(thisLast+dx/dy, otherFirst+other.dx/other.dy)...
}
```
It has **NO text guard at all** and does **NOT check `this`'s own
strategy** — only `other.snake.cannotBeTouched()`
(`Snake.java:291-293`: `mergeable != FULL || worm.isPureHorizontal()`).
Practically: this fires for whatever is STILL separately pending after
the merge pass — i.e. pairs where `Snake.merge` returned null (NONE
strategy on either side, or the "other" carried text) YET the
coordinates still touch AND the untouchable side (`other` in THIS
check) is FULL and not pure-horizontal. None of the 10 sampled rows
needed this path (§4); it still must be ported as a distinct pass, not
folded into the merge loop, because it has different eligibility rules
(no text guard; one-sided strategy check) — collapsing the two into one
function would silently change which snakes lose decoration when a
text-blocked or NONE-blocked pair still touches.

**Scope boundary**: `UGraphicForSnake` is instantiated once per
`Swimlanes.drawU` call (the whole-diagram wrapper) and — per
decisions.md D1 — again, NESTED, inside `FtileGroup`'s own draw path
(not independently re-verified by this census; grep `FtileGroup.java`
for its own `UGraphicForSnake`/`apply` wrapping before relying on this).
Pending snakes never survive a flush, and a flush happens when the
INNER `UGraphicForSnake` finishes (nested graphic's own `flushUg`), so
two snakes on either side of a `partition`/`group` boundary can never
merge. §3 case F attempted to demonstrate this and failed to isolate it
cleanly (confound documented there) — T1b should write its own isolated
group-boundary test before relying on this description.

**Collision risk in this port's geometry** (the add1 false-positive,
`.agent-notes/T3b-walker-edges.md`): a full-history, unscoped merge scan
will fuse coordinate-coincident-but-semantically-unrelated edges
wherever two DIFFERENT builders independently compute the same point
(e.g. a diamond's own hook point and an unrelated horizontal merge
line landing on the same `(x,y)`, or `GtileWhile`'s `ConnectionOut`
producing two genuinely separate Snakes whose endpoints happen to
coincide in our current coordinate assignment). The jar avoids this
NOT by deduplicating coordinates but by `MergeStrategy.NONE` on the
specific snakes that must never be touched (3 live NONE sites, §1) —
the fix is to thread a `mergeable` field onto `ActivityEdgeGeo` from the
SAME builders that set it upstream (`FtileIfDown`/`FtileIfWithLinks`'s
`ConnectionHline`, `FtileWhile`'s `ConnectionIn`/`ConnectionBackSimple`/
`ConnectionOut`), not to add coordinate-proximity heuristics.
