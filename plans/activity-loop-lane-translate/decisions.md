# Architecture decisions — `activity-loop-lane-translate`

Confirmed 2026-09-19. **Locked**; amend and halt on contradiction (stop 3).
Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/`.
`Hexagon.hexagonHalfSize = 12` (`ftile/Hexagon.java:46`).

## The mechanism, quoted

`Swimlanes.Cross#draw` (`ftile/Swimlanes.java`, inner class `Cross`): for a
`Connection` whose `tile1.getSwimlaneOut() != tile2.getSwimlaneIn()`, `new
ConnectionCross(connection).drawU(getUg())`. `ConnectionCross#drawU`
(`ftile/ConnectionCross.java:47-63`): only `if (connection instanceof
ConnectionTranslatable)`, then `conn.drawTranslate(ug,
swimlane1.getTranslate(), swimlane2.getTranslate())`; otherwise nothing.
Translatable in `FtileWhile`: `ConnectionIn` (`:171`), `ConnectionBackSimple`
(`:217`). NOT translatable: `ConnectionBackBackward1/2` (`:313`, `:367`),
`ConnectionBackEmpty` (`:410`), `ConnectionOut` (`:465`),
`ConnectionOutSpecial` (`:513`). Translatable in `FtileRepeat`:
`ConnectionIn` (`:221`), `ConnectionOut` (`:275`), `ConnectionBackComplex1`
(`:333`), `ConnectionBackBackward1/2` (`:406`, `:463`), `ConnectionBackSimple1`
(`:537`), `ConnectionBackSimple2` (`:608`).

## D1 — Translate shapes are computed at placement, in `routeEdge`

**Context.** `translate1`/`translate2` are the lanes' x origins
(`Swimlanes.java:428` `swimlane.setTranslate(UTranslate.dx(xx))`), known only
after `computeLaneOrigins`; the walkers run before. `ConnectionCross` binds
them late, at draw time.
**Decision.** `swimlane-placement.ts#routeEdge` dispatches on a per-edge tag
to a shape function that receives the lane deltas; walkers never compute a
translated point.
**Consequences.** One dispatch site; walkers stay lane-agnostic; the shapes
are pure functions of (context, dx1, dx2) and unit-testable against golden
coordinates.

## D2 — The walker hands placement plain data

**Context.** Each `drawTranslate` reads only tile-local geometry — `getP1/
getP2` untranslated, `calculateDimension()` widths/heights, the diamonds'
`inY/outY/width/height` — plus the two translates.
**Decision.** `EdgeMeta` gains an optional tagged `loop` record (`LoopTranslate`
union, `swimlane-loop-translate.ts`) carrying exactly those quantities as
numbers; no closures, no tile references.
**Consequences.** `EdgeMeta` stays internal to `layout/`; a shape that needs
more than the record can supply is stop 10, not a wider record.

## D3 — `routeEdge` returns an array; the repeat exit becomes two edges

**Context.** `FtileRepeat.ConnectionOut#drawTranslate` (`:309-331`) draws an
unarrowed snake `mp1a -> (mp1a.x, middle) -> (mp2b.x, middle)` then a second
`small` snake `(mp2b.x, middle) -> mp2b` with `asToDown` and the `tbout`
label. Every other shape stays one edge.
**Decision.** `routeEdge` returns `{ edges: ActivityEdgeGeo[], reservations:
Reservation[] }`; `placeSwimlanes` flat-maps. Untagged edges return exactly
one edge, so the no-lane passthrough stays byte-identical.
**Consequences.** `PlacementResult.edges.length` may exceed the input; tests
that indexed edges positionally must key by endpoint.

## D4 — Explicit mid-arrow point; translate shapes may add reservations

**Context.** `FtileWhile.ConnectionBackSimple#drawTranslate` (`:277-308`)
builds its snake with NO `emphasizeDirection`, then draws `asToUp`
separately at `(xx, (y1 + y2) / 2)` and `UEmpty(5, hexagonHalfSize)` at
`(x1, y1 + hexagonHalfSize)`. The renderer's `emphasize` places the arrow at
the segment midpoint (`renderer.ts:162-176`), which is `(y1 + 12 + y2) / 2`
here — 6 px off.
**Decision.** `ActivityEdgeGeo` gains optional `midArrowAt?: { x, y, dir }`
(`dir` from the existing `'up'|'down'|'left'|'right'`); `renderEdge` draws one
`arrowTip` there in addition to the terminal one. Loop shapes return
reservations alongside edges (D3's shape).
**Consequences.** `emphasize` keeps its `Worm` semantics untouched; the
reservation lands in `PlacementResult.reservations` like a divider's.

## D5 — Only tagged shapes translate; the untagged cross-lane rule is T0's

**Context.** `ConnectionCross#drawU` draws nothing for a non-translatable
connection. What the per-lane pass (`UGraphicInterceptorOneSwimlane`,
`Swimlanes.java:342`) does with such a connection whose tiles sit in
different lanes is unread.
**Decision.** T0 reads `UGraphicInterceptorOneSwimlane` and journals the
answer with `file:line`. Until then untagged cross-lane edges keep today's
generic elbow. If the jar draws them in one lane, we mirror that; if it
drops them, a `'not-translatable'` tag suppresses them and the brief records
a preserved upstream behaviour. Any third outcome is stop 9.
**Consequences.** `FtileWhile`'s `ConnectionBackEmpty`/`ConnectionOut` are
the affected classes; no repeat class is.

## D6 — Exit signal

Per-builder `--align` alignment and per-tag element-count parity on T0's
classified rows; every endpoint of a translated connector within 0.01 px of
the golden after canvas offset, or a named residual with its Java cite. The
aggregate `weightedScore` is recorded at every batch close and never gated
(anti-monotone under element growth). Diagonal scan 0. One re-pin at T6
after adjudicating every rise by class.

## D7 — `MergeStrategy.LIMITED` is ignored

`Snake.withMerge(MergeStrategy.LIMITED)` on the translate snakes only
affects overlapping-segment welding in `UGraphicForSnake`, never the points.
Snake merging is a filed negative result (`activity-snake-merge`). A residual
it explains is recorded, not chased.

## D8 — Scope of the 22 rows

`camavo-50-kaku123`, `vupuse-73-nuso490`, `zepima-96-peco612` declare no
swimlane (0 `|` lines) and leave at T0, re-filed with the mechanism the
probe shows. `backward:` bodies are unparsed, so `ConnectionBackBackward1/2`
translate shapes (`FtileWhile.java:313-408`, `FtileRepeat.java:406-536`) are
out of scope; cite them in the `activity-loop-backward` filing.

## D9 — Ride-alongs are an optional, T0-gated last batch

`activity-repeat-break-welding` (`walk-repeat.ts` only,
`FtileFactoryDelegatorRepeat.java:123`) and `activity-gtile-break-size`
(`tiles/gtile-break.ts` only, `FtileBreak.java:62-64`, `FtileEmpty.java:74-76`)
run as T5a/T5b, one commit each, only if T0's classification leaves a break
row among the residuals after the translate shapes land or the welding path
is touched anyway. Otherwise struck, journaled, filings untouched.
