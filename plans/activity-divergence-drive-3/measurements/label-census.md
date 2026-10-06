# T1a — label + translate census

Diagnosis only (no `src/` edits). Java is `~/git/plantuml` (verified this
run). "ourSite" = where the TEXT for that `Snake.withLabel`/edge actually
reaches our `ActivityEdgeGeo.label`, or `MISSING` with the mechanism why
not. `ActivityEdgeGeo` (`src/diagrams/activity/activity-geometry.types.ts:39-67`)
has **no alignment field of any kind** — confirmed by reading the type: it
carries `label?: string` and nothing resembling `VerticalAlignment`/
`HorizontalAlignment`. So even where the TEXT is ported, the ALIGNMENT
branch it should draw through (table 2 below) is never carried — every
site in table 1 that reaches us at all renders through the ONE generic
fallback at `src/diagrams/activity/renderer.ts:277-284` (`midPt.x+4,
midPt.y-4`, `mid = Math.floor(pts.length/2)`), never `Snake.java:244-267`'s
branches. This is the root mechanism table 1's `ourSite` column documents
per-row; T1b's job is to add the alignment field and the five branches.

## Table 1 — `Snake.withLabel(…)` call sites

`USE_GTILE=false` confirmed (`net/sourceforge/plantuml/activitydiagram3/
gtile/Gtile.java:47`) — `gtile/` skipped; its `GtileWhile.java:365,400`
calls are commented out (`// arrowHorizontalAlignment())`), dead code.

`arrowHorizontalAlignment()` (`ftile/AbstractFtile.java:108-110`) returns
`skinParam.getHorizontalAlignment(AlignmentParam.arrowMessageAlignment,
null, false, null)`; default `HorizontalAlignment.LEFT`
(`skin/AlignmentParam.java:42`), overridable via `skinparam
arrowMessageAlignment left|center|right`. `AbstractConnection
#arrowHorizontalAlignment` (`ftile/AbstractConnection.java:63-70`)
delegates to whichever of `ftile1`/`ftile2` is non-null, falling back to
`LEFT`.

| # | javaClass | file:line | alignment | ourSite |
|---|---|---|---|---|
| 1 | `FtileFactoryDelegatorAssembly$ConnectionVerticalDown` (generic sequential step-to-step) | `vcompact/ConnectionVerticalDown.java:79-80,89-90` | `arrowHorizontalAlignment()` | **MISSING** — `src/diagrams/activity/layout/tile-layout.ts:405-436` (`EARLY_LEAF_KINDS` incl. `'arrow-label'`); `tileNodes` (`tile-layout.ts:118-137`) `continue`s past an `arrow-label` node, never attaching its text to the following edge. Confirmed by render (see Oracle case `label-default` below): jar draws `hello`, ours draws nothing, canvas 19px shorter. |
| 2 | `FtileIfLongHorizontal$ConnectionIn` (`out2`, "else" exit label) | `vcompact/FtileIfLongHorizontal.java:377-378` | `arrowHorizontalAlignment()` | **MISSING** (same `-> label;` mechanism feeding `out2`; `walk-if-long-horizontal.ts` never reads an arrow-label AST node) |
| 3 | `FtileIfLongHorizontal$ConnectionLastElseOut` (`out2`) | `vcompact/FtileIfLongHorizontal.java:458-459` | `arrowHorizontalAlignment()` | **MISSING** (same mechanism) |
| 4 | `FtileIfLongVertical$ConnectionVertical` (`label`, between stacked diamonds) | `vcompact/FtileIfLongVertical.java:280-281` | `VerticalAlignment.CENTER` | **MISSING** |
| 5 | `FtileIfLongVertical$ConnectionLastElse` (`label`) | `vcompact/FtileIfLongVertical.java:319-320` | `VerticalAlignment.CENTER` | **MISSING** |
| 6 | `FtileRepeat$ConnectionIn` (`tbin`) | `vcompact/FtileRepeat.java:260-261` | `arrowHorizontalAlignment()` | **MISSING** — `walk-repeat.ts:258` doc confirms "no repeat fixture has an `arrow-label` line before its body" and `tbin1` is hardcoded `null`; the AST has no dedicated field for a pre-`repeat` arrow label either |
| 7 | `FtileRepeat$ConnectionOut` (`tbout`, `drawU`) | `vcompact/FtileRepeat.java:300-301` | `arrowHorizontalAlignment()` | **MISSING** (same — `tbout1` hardcoded `null`, `walk-repeat.ts:274`) |
| 8 | `FtileRepeat$ConnectionOut` (`tbout`, `drawTranslate` 2nd snake) | `vcompact/FtileRepeat.java:323-324` | `arrowHorizontalAlignment()` | **MISSING** (cross-lane variant of #7; also no `LoopTranslate` kind — see Table 2 row `ConnectionOut`) |
| 9 | `FtileRepeat$ConnectionBackBackward1` (`tbback`, "is"-side back label) | `vcompact/FtileRepeat.java:451-452` | `arrowHorizontalAlignment()` | PORTED (text) — `walk-repeat-backward.ts:108` (`lanes.backIncoming`, a dedicated `backward:`-parsed field, NOT the generic arrow-label node); alignment still MISSING (generic fallback) |
| 10 | `FtileRepeat$backConnection` simple1 (`label`, `drawU`) | `vcompact/FtileRepeat.java:503` | `arrowHorizontalAlignment()` | PORTED (text, same `backward:`-field path) — `walk-repeat-backward.ts:110`; alignment MISSING |
| 11 | `FtileRepeat$backConnection` simple1 (`label`, `drawTranslate`) | `vcompact/FtileRepeat.java:518` | `arrowHorizontalAlignment()` | PORTED (text); alignment MISSING |
| 12 | `FtileRepeat$ConnectionBackComplex1` (`tbback`, `drawU`) | `vcompact/FtileRepeat.java:559` | `arrowHorizontalAlignment()` | PORTED (text, `backward:` field) — same as #9/#10 family, `walk-repeat-backward.ts` |
| 13 | `FtileRepeat$ConnectionBackComplex1` (`tbback`, `drawTranslate`) | `vcompact/FtileRepeat.java:582` | `arrowHorizontalAlignment()` | PORTED (text); alignment MISSING |
| 14 | `FtileRepeat$ConnectionBackSimple2`(?) (`tbback`) | `vcompact/FtileRepeat.java:630` | `arrowHorizontalAlignment()` | PORTED (text); alignment MISSING |
| 15 | `FtileRepeat$ConnectionBackBackward2` (`tbback`) | `vcompact/FtileRepeat.java:672` | `arrowHorizontalAlignment()` | PORTED (text) — `walk-repeat-backward.ts:52,72` (`lanes.backOutgoing`) |
| 16 | `FtileWhile$ConnectionBackSimple` (`back`, `drawU`) | `vcompact/FtileWhile.java:261-262` | `VerticalAlignment.BOTTOM` (literal, NOT `arrowHorizontalAlignment`) | PORTED (text) — `walk-while-backward.ts:44,52` (`backIncoming`). Oracle case `label-bottom-while-backward` below: text IS drawn, x matches jar exactly (177.675=177.675), y off by 6.445px (146.278 jar vs 139.833 ours) — the BOTTOM branch's own `y = worm.getMaxY()` math (`Snake.java:252-253`) is not what our generic fallback computes. |
| 17 | `FtileWhile$ConnectionBackBackward1` (`back`) | `vcompact/FtileWhile.java:354-355` | `VerticalAlignment.BOTTOM` | PORTED (text) — `walk-while-backward.ts` (same `backIncoming`/`pushBackward1` path); alignment MISSING |
| 18 | `FtileWhile$ConnectionBackBackward2` (`back`) | `vcompact/FtileWhile.java:389-390` | `arrowHorizontalAlignment()` | PORTED (text) — `walk-while-backward.ts:67,72` (`backOutgoing`); alignment MISSING |
| 19 | `ParallelBuilderFork$ConnectionIn` (`label`, `drawU`) | `vcompact/ParallelBuilderFork.java:156` | `arrowHorizontalAlignment()` | **MISSING** — `parallel-dispatch.ts` parses `fork again`'s own label (D56/add2 T3i) but `walk-fork-branches.ts` only applies `t.joinLabel` to the JOIN edge (line 234); no code path applies a per-branch fork-IN label |
| 20 | `ParallelBuilderFork$ConnectionIn` (`label`, `drawTranslate`) | `vcompact/ParallelBuilderFork.java:174` | `arrowHorizontalAlignment()` | **MISSING** (same) |
| 21 | `ParallelBuilderFork$ConnectionOut` (`label`, `drawU`) | `vcompact/ParallelBuilderFork.java:210` | `arrowHorizontalAlignment()` | PORTED (text) — `walk-fork-branches.ts:234` (`t.joinLabel`, `end fork {label}`, add2 T3i); alignment MISSING |
| 22 | `ParallelBuilderFork$ConnectionOut` (`label`, `drawTranslate`) | `vcompact/ParallelBuilderFork.java:231` | `arrowHorizontalAlignment()` | PORTED (text); alignment MISSING |
| 23 | `ParallelBuilderMerge$ConnectionIn` (`label`, `drawU`) | `vcompact/ParallelBuilderMerge.java:211` | `arrowHorizontalAlignment()` | **MISSING** — merge's incoming-branch label (`ftile1.getOutLinkRendering()`, i.e. a `-> label;` before `end merge`); same dropped-arrow-label mechanism as #1 |
| 24 | `ParallelBuilderMerge$ConnectionIn` (`label`, `drawTranslate`) | `vcompact/ParallelBuilderMerge.java:227` | `arrowHorizontalAlignment()` | **MISSING** (same) |
| 25 | `ParallelBuilderSplit$ConnectionIn` (`label`, `drawU`) | `vcompact/ParallelBuilderSplit.java:199` | `arrowHorizontalAlignment()` | **MISSING** (same family as #19/#20, split variant) |
| 26 | `ParallelBuilderSplit$ConnectionIn` (`label`, `drawTranslate`) | `vcompact/ParallelBuilderSplit.java:215` | `arrowHorizontalAlignment()` | **MISSING** |
| 27 | `ParallelBuilderSplit$ConnectionOut` (`label`, `drawU`) | `vcompact/ParallelBuilderSplit.java:254` | `arrowHorizontalAlignment()` | **MISSING** |
| 28 | `ParallelBuilderSplit$ConnectionOut` (`label`, `drawTranslate`) | `vcompact/ParallelBuilderSplit.java:275` | `arrowHorizontalAlignment()` | **MISSING** |
| 29 | `FtileIfWithLinks$ConnectionIn`(?) (`out2`) | `vcompact/cond/FtileIfWithLinks.java:395-396` | `arrowHorizontalAlignment()` | **MISSING** (same `-> label;` family) |
| 30 | `FtileSwitchWithManyLinks$ConnectionHorizontalThenVertical` (`outLabel`) | `vcompact/cond/FtileSwitchWithManyLinks.java:176-177` | `VerticalAlignment.CENTER` | **MISSING** (text) — this is the between-branch connector label, not `branch.getTextBlockPositive()`; no corresponding push found in `walk-switch.ts` |
| 31 | `FtileSwitchWithManyLinks$ConnectionVerticalTop` (`branch.getTextBlockPositive()`) | `vcompact/cond/FtileSwitchWithManyLinks.java:218-219` | `VerticalAlignment.CENTER` | AMBIGUOUS — Oracle case `label-center-switch` below shows this label's TEXT ("blue") drawn once in both jar and ours but at unrelated positions (jar 123.05,87.06 vs ours 266.0,111) — confounded by a switch-tile LAYOUT divergence (case-diamond placement), not isolable as an alignment-branch comparison. Flagged, not resolved here. |
| 32 | `FtileSwitchWithManyLinks$ConnectionVerticalBottom` (`outLabel`) | `vcompact/cond/FtileSwitchWithManyLinks.java:274-275` | `VerticalAlignment.CENTER` | **MISSING** (text; distinct from #31) |
| 33 | `FtileSwitchWithManyLinks$ConnectionHorizontalThenVerticalCrossSwimlane` | `vcompact/cond/FtileSwitchWithManyLinks.java:325-326` | `arrowHorizontalAlignment()` | PORTED (text) via `branch.getTextBlockPositive()` same as #31's data; cross-lane SHAPE ported as `'switch-h-then-v-cross'` (Table 2) |
| 34 | `FtileSwitchWithOneLink$Connection` | `vcompact/cond/FtileSwitchWithOneLink.java:82-83` | `arrowHorizontalAlignment()` | **MISSING** (same family as #30/#32) |

**Row count: 34** (brief estimated ~30; `gtile/` excluded per `USE_GTILE=
false`). Of these: **1 alignment argument is carried nowhere** in our
port (`ActivityEdgeGeo` has no alignment field — true for all 34 rows,
not per-row repeated above). Text reaches us (`PORTED (text)`) for 12/34
rows (the `backward:`/`repeat`-keyword/`end fork/merge`-label families,
which the parser attaches to a dedicated AST field); text is **MISSING**
entirely for 21/34 rows (every row fed by the generic `-> label;` /
`ActivityArrowLabel` mechanism, which `tileNodes`
(`src/diagrams/activity/layout/tile-layout.ts:118-137`) silently drops);
1 row (#31) is confounded by an unrelated switch-layout divergence.

## Table 2 — `drawTranslate` (cross-swimlane) sites

Mechanism: `ConnectionCross#drawU` (`ftile/ConnectionCross.java:47-63`)
only invokes `drawTranslate` when the wrapped `Connection` is
`instanceof ConnectionTranslatable`; a connection class that does NOT
implement that interface draws **nothing** when its two endpoints are in
different swimlanes (no same-lane fallback render — confirmed by
`drawU`'s own `if (swimlane1 == null) return;` / `if (swimlane2 == null)
return;` guards framing the single `drawTranslate` call, no `else`
branch).

| javaClass | file:line | ourKind | status |
|---|---|---|---|
| `ConnectionVerticalDown` | `vcompact/ConnectionVerticalDown.java:86-101` | `'default'` | PORTED — `swimlane-placement.ts` top doc, cited at `:12-14` |
| `FtileIfDown$ConnectionIn`/`ConnectionOut` | `vcompact/FtileIfDown.java:225-238,284-301` | `'default'` | PORTED (byte-identical middle-Y shape, per `swimlane-placement.ts:13-14`) |
| `FtileWhile$ConnectionIn` | `vcompact/FtileWhile.java:171-214` | `'default'` | PORTED |
| `FtileWhile$ConnectionBackSimple` | `vcompact/FtileWhile.java:217-308` | `'while-back'` | PORTED — `swimlane-loop-translate.ts:53` (`WhileBackLoop`) |
| `FtileWhile$ConnectionBackBackward1` | `vcompact/FtileWhile.java:313-365` (no `drawTranslate`, NOT `ConnectionTranslatable`) | n/a | Upstream itself draws NOTHING cross-lane (see mechanism above) — not a port gap, a Java design choice. Confirm our `walk-while-backward.ts#pushBackward1` has no lane-conditional suppression (unchecked here — flagged for T1c). |
| `FtileWhile$ConnectionBackBackward2` | `vcompact/FtileWhile.java:367-410` (no `drawTranslate`) | n/a | Same as above (upstream draws nothing cross-lane) |
| `FtileRepeat$ConnectionIn` | `vcompact/FtileRepeat.java:221-274` | `'default'` | PORTED (presumed via `'default'`'s generic middle-Y; not individually cited) |
| `FtileRepeat$ConnectionOut` | `vcompact/FtileRepeat.java:275-331` | `'repeat-out'` | PORTED — `swimlane-loop-translate.ts:66` (`RepeatOutLoop`) |
| `FtileRepeat$ConnectionBackComplex1` | `vcompact/FtileRepeat.java:333-404` | `'repeat-complex1'` | PORTED — `swimlane-loop-translate.ts:110` |
| `FtileRepeat$ConnectionBackBackward1` | `vcompact/FtileRepeat.java:406-460` (`drawTranslate` at `:432-460`) | **MISSING** | Self-documented residual: `walk-repeat-backward.ts:14-21` — "`drawTranslate` ... is NOT ported here ... Every edge pushed here carries no `loop` tag, so a backward activity in a different lane ... renders in the SAME-LANE shape regardless of lane — a documented residual, not a silent one." |
| `FtileRepeat$ConnectionBackBackward2` | `vcompact/FtileRepeat.java:463-535` (`drawTranslate` at `:483-535`) | **MISSING** | Same residual as above (same doc comment covers both) |
| `FtileRepeat$ConnectionBackSimple1` | `vcompact/FtileRepeat.java:537-606` | `'repeat-simple1'` | PORTED — `swimlane-loop-translate.ts:79` |
| `FtileRepeat$ConnectionBackSimple2` | `vcompact/FtileRepeat.java:608-683` | `'repeat-simple2'` | PORTED — `swimlane-loop-translate.ts:95` |
| `FtileIfLongHorizontal$ConnectionVerticalIn` | `vcompact/FtileIfLongHorizontal.java:389-437` (`drawTranslate` `:419-435`) | `'if-vertical-in'` | PORTED — `swimlane-placement.ts:97-104` (mission `activity-if-tile-port` T1 Q4/T5) |
| `ParallelBuilderFork$ConnectionIn` | `vcompact/ParallelBuilderFork.java:150-184` | `'parallel-in'` | PORTED — `swimlane-placement.ts:15-17` |
| `ParallelBuilderFork$ConnectionOut` | `vcompact/ParallelBuilderFork.java:193-241` | `'parallel-out'` | PORTED — `swimlane-placement.ts:18-20` |
| `ParallelBuilderMerge$ConnectionIn` | `vcompact/ParallelBuilderMerge.java:193-230` | `'parallel-in'` | PORTED (reused fork tag — Merge has no separate `ConnectionOut`, only incoming branches merge) |
| `ParallelBuilderSplit$ConnectionIn` | `vcompact/ParallelBuilderSplit.java:?-225` | `'parallel-in-split'` | PORTED — `swimlane-placement.ts:21` |
| `ParallelBuilderSplit$ConnectionOut` | `vcompact/ParallelBuilderSplit.java:?-285` | `'parallel-out-split'` | PORTED — `swimlane-placement.ts:21` |
| `FtileSwitchWithManyLinks$ConnectionHorizontalThenVerticalCrossSwimlane` | `vcompact/cond/FtileSwitchWithManyLinks.java:297-339` | `'switch-h-then-v-cross'` | PORTED — `swimlane-loop-translate.ts:122-133` (mission `activity-divergence-drive-2` T1p-e) |
| `FtileSwitchWithManyLinks$ConnectionVerticalThenHorizontalCrossSwimlane` | `vcompact/cond/FtileSwitchWithManyLinks.java:352-393` | `'switch-v-then-h-cross'` | PORTED — `swimlane-loop-translate.ts:137-148` |
| `FtileIfWithLinks$ConnectionHorizontalThenVertical` | `vcompact/cond/FtileIfWithLinks.java:90-176` (`drawTranslate` `:149-172`) | **MISSING** | No `LoopTranslate`/`EdgeShape` kind exists for this class anywhere in `swimlane-placement.ts`/`swimlane-loop-translate*.ts`; `walk-if-with-links.ts` tags no edge with a dedicated cross-swimlane shape for if-with-links branches. |
| `FtileIfWithLinks$ConnectionVerticalThenHorizontal` | `vcompact/cond/FtileIfWithLinks.java:177-287` (`drawTranslate` `:238-286`) | **MISSING** | Same gap as above — two-phase zigzag with a MergeStrategy.LIMITED small-snake elbow, not reducible to the generic `'default'` middle-Y shape. |
| `FtileIfWithLinks$ConnectionVerticalThenHorizontalDirect` | `vcompact/cond/FtileIfWithLinks.java:288-367` (`drawTranslate` `:328-355`) | **MISSING** | Same gap (the `!hasTwoBranches()` single-branch variant). |

## Oracle mini-cases

Each case: `.puml` + jar SVG (`in.svg`, via `scripts/oracle-render.sh`,
deterministic text) + our SVG (`ours.svg`, via `renderFixtureActivity` +
`DeterministicMeasurer`, same seams `scripts/activity-probe.ts` uses).
Render script used: `scripts/tmp-render-case.ts` (temporary, NOT
committed — write-set is `measurements/**` only; see report for cleanup).

| case | branch (`Snake.java:244-267`) | jar text x,y | ours text x,y | finding |
|---|---|---|---|---|
| `label-default` | default (straight line, no `verticalAlignment`, not zigzag, not RD/LD) | `x=40.35, y=106.5` (`<text ... textLength="23.306">hello</text>`) | **no `hello` text anywhere in the SVG** | CONFIRMED: generic top-level `-> label;` text is completely dropped (not an alignment bug — the string never reaches the renderer). Canvas height differs too: jar `220px`, ours `201px` (19px) — the jar reserves height for the label row (`FtileFactoryDelegatorAssembly#assembly:60-61`, `height += textBlock.calculateDimension().getHeight()`); ours never reserves it, confirming the drop is at the LAYOUT stage, not just the render stage. |
| `label-bottom-while-backward` | `VerticalAlignment.BOTTOM` (`:251-253`, `x=worm.getMinX()`, `y=worm.getMaxY()`) | `x=177.675, y=146.278` (`Warning`) | `x=177.675, y=139.833` | Text IS drawn (ported via `backward:`'s dedicated AST field, not the generic mechanism). `x` matches EXACTLY. `y` differs by `6.445px` — our generic `midY-4` fallback doesn't compute `worm.getMaxY()`. |
| `label-center-switch` | `VerticalAlignment.CENTER` via `branch.getTextBlockPositive()` (`ConnectionVerticalTop`, `:218-219`) | `blue` at `x=123.05, y=87.056` | `blue` at `x=266.028, y=111` | CONFOUNDED: both draw the text exactly once, but at positions ~140px apart in X — this is a switch CASE-DIAMOND layout divergence (tracked separately per `.agent-notes` switch backlog), not an isolable alignment-branch delta. Not resolved here. |
| `label-colored-pill` | default branch + `<back:color>` | NO literal rect. Jar emits an SVG `<filter>` def (`feFlood flood-color="#FF0000"` + `feComposite in="SourceGraphic" in2="flood" operator="over"`) and sets `filter="url(#...)"` directly on the `<text>` element — a vector-exact flood behind the glyphs, not a sized rectangle. `@see net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:732-735,772-786` (`getFilterBackColor`). | No text at all (same drop as `label-default`) | TWO findings: (1) same generic-label drop applies with a colour prefix too; (2) independent of (1), our `renderEdgeLabel`'s pill design (`src/diagrams/activity/renderer.ts:82-111`, a `rect` sized `label.length * fontSize*0.6 + 8`) is NOT what the jar does at all — the jar never draws a rect, it filters the text glyphs themselves. This is a structural renderer defect, not a sizing-constant tuning problem. |

**Not completed** (budget): the zigzag `DLD`/`DRD` branches
(`Snake.java:257-261`, `HorizontalAlignment.CENTER`/`RIGHT` + a
3-segment direction code starting `DLD`/`DRD`) and the `RD`/`LD` branches
(`:262-266`) have no oracle mini-case here — constructing a minimal
fixture that reliably produces that exact `Worm` direction code (it
depends on `arrowMessageAlignment` skinparam + branch geometry
interacting in a way not obvious from a single read of `Worm
#getDirectionsCode`) needs more investigation than this task's budget
allowed. Flagged for T1b, which needs these branches anyway to
implement them and can build/verify the fixture alongside that work.

## Canvas extent (`getMaxX`, item 4)

`Snake.getMaxX` (`ftile/Snake.java:234-242`) loops `texts` and does
`result = Math.max(result, position.getX() + dim.getWidth())` for
EVERY label on the snake, in addition to `worm.getMaxX()` — so a label
hanging past the line's own rightmost point always widens the tile's
(and ultimately the canvas's) `FtileGeometry`, which is how
`LimitFinder` (`klimt/drawing/LimitFinder.java`) ends up reserving room
before the real `drawU` pass ever runs (two-pass: dry-run `LimitFinder`
sizing pass, then draw).

Our analogue, `extendForEdge`/`edgeInkX`
(`src/diagrams/activity/layout/canvas-origin.ts:227-250`), accumulates
`acc.maxX`/`acc.maxY` from `edge.points` and arrowhead tips ONLY —
**it never reads `edge.label` at all**, confirmed by reading the full
function body (no `label`/`text` token appears in `extendForEdge` or
`edgeInkX`). So any edge label that would extend past the edge's own
geometry is invisible to `computeCanvasOrigin`
(`canvas-origin.ts:359-388`) and can clip at the canvas edge instead of
widening it, the same class of gap `oracle-seam-embedded-42x42`/
`oracle-score-blind-to-magnitude` already found for other text-driven
extents. This is INDEPENDENT of the label-drop findings above — it would
still apply once T1b wires the dropped text through, unless T1b also
extends `extendForEdge`.

`layout/compress/compress-geometry.ts#withEmphasizeAnchor` (line 178) is
the cited "analogous carried anchor" pattern (an annotation computed once
pre-compression and carried through so the compressed draw can still
reference the ORIGINAL anchor point) — relevant to T1b/T1c if a label's
position needs the same pre-compression-anchor treatment Snake's own
`getTextBlockPosition` effectively gets for free (it runs on the SAME
`worm` the `drawU` pass draws, post-compression, so no separate anchor
carry is needed upstream; our pipeline's `withEmphasizeAnchor` precedent
is the pattern to reuse IF a label position must be computed before
compression runs).
