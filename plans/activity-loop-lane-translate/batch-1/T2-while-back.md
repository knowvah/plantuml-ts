# T2 — `FtileWhile.ConnectionBackSimple#drawTranslate`

**Agent:** typescript-pro · **Depends on:** T0, T1 · Isolated worktree.

## Context

Read [`../README.md`](../README.md), [`../decisions.md`](../decisions.md)
D1–D4, D7, T1's `LoopTranslate` (`layout/swimlane-loop-translate.ts`) and
the stub in `layout/swimlane-loop-translate-while.ts`, and T0's
`../fixtures.md` (which rows reach `while-back`; representative
`kijazo-83-kipu485`, `ruzica-16-deli877`, `xovano-23-tazo278`).

**The Java** (`ftile/vcompact/FtileWhile.java:277-308`), quoted:
`p1 = translate1.getTranslated(getP1())` (body's `pointOut` via
`getTranslateForWhile`), `p2 = translate2.getTranslated(getP2())` (diamond1's
origin via `getTranslateDiamond1`); `x1 = p1.x; y1 = p1.y; x2 = p2.x +
dimDiamond1.width; half = (dimDiamond1.outY - dimDiamond1.inY) / 2; y2 =
p2.y + dimDiamond1.inY + half`; snake `asToLeft`, `withMerge(LIMITED)`, NO
`emphasizeDirection`: `(x1,y1) -> (x1, y1+12) -> (xx, y1+12) -> (xx, y2) ->
(x2, y2)` with `xx = max(translate1.dx, translate2.dx) + dimTotal.width`;
then `UEmpty(5, 12)` at `(x1, y1+12)`; then `asToUp` at `(xx, (y1+y2)/2)`.
Compare `drawU` (`:246-275`): `y1bis = max(y1, bottom) + 12`, `xx =
dimTotal.width`, `emphasizeDirection(UP)`, label `back` — the translate
snake carries no label.

**Ours today.** `walk-while-branch.ts#pushWhileBack` (`:153-200`) pushes
`backEdgePoints(...)` (`:111`) with `[bodyOutLane, headerInLane]` and
`emphasize: 'up'`, plus `whileHexagonReservation`; `routeEdge` then
overwrites the shape when lanes differ.

## Fix

1. `pushWhileBack`: when the body has a point out, pass a `loop` record
   `{ kind: 'while-back', p1: backFrom (untranslated), p2: diamond1 origin
   (hX, hY), dimTotalWidth: t.width, diamond: { inY, outY, width } from the
   header tile }` through `pushEdgeFlagged`/`pushEdge`. The pushed POINTS
   stay the `drawU` shape (same-lane case unchanged). The empty-body branch
   (`ConnectionBackEmpty`, not translatable) gets no record.
2. `swimlane-loop-translate-while.ts#whileBackTranslate(loop, edge, dx1, dx2)`:
   the arithmetic above; returns the 5-point edge with `emphasize` REMOVED,
   `arrowhead` kept (asToLeft terminal), `midArrowAt: { x: xx, y: (y1+y2)/2,
   dir: 'up' }`, and one reservation for `UEmpty(5, 12)` at `(x1, y1+12)`
   (build it the way `whileHexagonReservation` builds its box).
3. Tests (`tests/diagrams/activity/layout/swimlane-loop-translate-while.test.ts`,
   new): the function against hand-derived numbers AND against golden
   coordinates read from `test-results/dot-cache/activity/<slug>/` for
   `kijazo` (the back edge's five points after canvas offset).

## Read-set

`src/diagrams/activity/layout/walk-while-branch.ts:85-300`;
`src/diagrams/activity/layout/swimlane-loop-translate.ts` (T1);
`src/diagrams/activity/layout/hexagon-reservations.ts`;
`src/diagrams/activity/tiles/gtile-while.ts` (header/diamond geometry
accessors); `ftile/vcompact/FtileWhile.java:217-308`; T0's
`../measurements/kijazo-83-kipu485.txt`, `ruzica-16-deli877.txt`.

## Write-set

`src/diagrams/activity/layout/swimlane-loop-translate-while.ts`,
`src/diagrams/activity/layout/walk-while-branch.ts`,
`tests/diagrams/activity/layout/swimlane-loop-translate-while.test.ts` (new),
`tests/diagrams/activity/layout/tile-coordinates.test.ts` (if a while assertion moves),
(no `walk-while-branch.test.ts` exists today; `tile-coordinates.test.ts`
assertions the geometry changes are updated with a Java cite, never deleted), `../measurements/t2.json`,
journal rows, `docs/catalog.md` on drift.

## Acceptance criteria

- Given a laned while whose body exits in a different lane from the header,
  when placed, then the back edge has the five points above with `xx =
  max(dx1, dx2) + dimTotal.width`, no `emphasize`, `midArrowAt` at
  `(xx, (y1+y2)/2)` up, and one reservation at `(x1, y1+12)` of size 5x12
- Given the same while with body and header in ONE lane, then output is
  byte-identical to T1's `t1.json`
- Given `kijazo-83-kipu485`, when `--align` runs, then per-tag counts equal
  the jar's and each back-edge endpoint is within 0.01 px of the golden after
  canvas offset (today 21/41, +1 line)
- Given `ruzica-16-deli877` and `xovano-23-tazo278`, then the same, or a
  named residual element with its Java cite in the journal
- Given `t2.json` vs `t1.json`, then every mover is a `fixtures.md`
  `while-back` row or a named parent re-centring

## Observability / rollback

N/A — no new observable operations; the gates are the SLIs. Reversible
(revert the commit; no data, no migration).

## Quality bar

`npm test` (JSON-reporter collected count = on-disk count), `npm run
typecheck`, `npm run lint`, `npm run build` all green before the commit. One
commit, `<type>(allt-TN): …` per `~/.claude/rules/commits.md`, body says
why. `git diff --name-only HEAD~1` = this write-set only.

## Boundaries

Always: read the Java method body before stating why anything differs;
every constant carries its `file:line`. Ask first (halt + journal): any
stop condition in `../README.md`. Never: refactor while porting; fit a
value; delete an assertion; touch `layout.old.ts` or `compress-geometry.ts`.
