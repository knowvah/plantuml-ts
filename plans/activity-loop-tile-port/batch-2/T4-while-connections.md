# T4 — while connections and break welding

**Agent:** typescript-pro · **Depends on:** T3

## Context

Faithful port; the Java is the spec. Read [`../README.md`](../README.md),
[`../decisions.md`](../decisions.md) D3, D6, D7, D8 (all quoted), the T3
contract, and the if precedent for explicit-point edges with `emphasize`
and `arrowhead: false` (`layout/walk-if-with-links.ts`,
`activity-layout-types.ts:37-58`, `renderer.ts:150-215`).

**The jar** (`vcompact/FtileWhile.java`), `backward == null`:

- `:148-168` order: `ConnectionIn`, `ConnectionBackSimple` (or
  `ConnectionBackEmpty` when the body has width 0 or height 0), then
  `ConnectionOut`; weldings appended after
  (`FtileFactoryDelegatorWhile.java:95-120`).
- `ConnectionIn` (`:171-196`): `p1 = diamond1 pointOut` (translated), `p2 =
  body pointIn`; two points, `asToDown`.
- `ConnectionBackSimple#drawU` (`:243-273`): returns early when the body
  has no pointOut (`:230-232`); `x1,y1 = body pointOut`; `x2 = d1.x + d1.w`;
  `y2 = d1.y + inY + (outY - inY)/2`; points `(x1,y1) -> (x1, y1bis) ->
  (width, y1bis) -> (width, y2) -> (x2, y2)` with `y1bis = max(y1,
  bodyBottom) + 12`; `asToLeft`, `emphasizeDirection(UP)`, label `back1`
  `VerticalAlignment.BOTTOM`; reservation `UEmpty(5, 12)` at `(x1, y1bis)`
  (`:272`, already `whileHexagonReservation`).
- `ConnectionOut#drawU` (`:483-511`): `x1 = d1.x`, `y1 = d1 mid` (same
  formula); snake `(x1,y1) -> (12, y1) -> (12, height)` with
  `emphasizeDirection(DOWN)`, `MergeStrategy.LIMITED`; second snake `(12,
  height) -> (left, height)` with NO arrow (`Snake.create(skinParam,
  color)` without a decoration -> `arrowhead: false`).
- `ConnectionBackEmpty` (`:410-464`): read and port its point list.
- Welding (`FtileFactoryDelegatorWhile.java:101-116`): for each `break`
  in the body, `(tr1.dx, tr1.dy) -> (12, tr1.dy)`, `asToLeft`.

**Ours.** `walk-while-branch.ts:45-62` draws a straight forward edge and a
`GConnectionVerticalDownThenBack` back edge landing on the header's NORTH.

## Fix

1. `walkWhile`: emit In, Back (or BackEmpty), Out (two edges), then one
   welding edge per break node emitted while walking the body (collect
   `out.nodes` of kind `'break'` pushed between the body walk's start and
   end indices, using their `x`/`y`); `emphasize: 'up'` on Back's vertical,
   `'down'` on Out's; the Out second snake `arrowhead: false`; label on
   Back from the while's `yesLabel`? — NO: `back1` is the `endwhile`'s
   incoming display (`:146`); read `node-dispatch.ts` for what ours
   captures and journal what is drawn.
2. Reservations: every `UEmpty(5, 12)` site in the ranges above.
3. Retire `backEdgeRightX`; delete `routing/gconnection-vertical-down-
   then-back.ts` if `grep` shows no reader outside `layout.old.ts` (D8).

## Write-set

`src/diagrams/activity/layout/walk-while-branch.ts`,
`src/diagrams/activity/tiles/gtile-while.ts`,
`src/diagrams/activity/layout/hexagon-reservations.ts`,
`src/diagrams/activity/routing/gconnection-vertical-down-then-back.ts`
(delete if unread) and its test; tests as T3 plus
`tests/diagrams/activity/layout/edge-draw-order.test.ts`;
`measurements/t4.json`; journal rows; `docs/catalog.md` on drift.

## Acceptance criteria

- Given `bareka-88-fusu160`, when `--align` runs, then the back edge enters
  the hexagon's right side at mid-height, the exit runs `x=12` then the
  bottom then to `left`, the break welds to `x=12`, and every endpoint of
  those edges matches the golden to 0.01 after canvas offset
- Given `cemagu-66-vazo965`, then line and polygon counts equal the jar's
- Given an empty body, then `ConnectionBackEmpty`'s point list
- Given `t4.json` vs `t3.json`, then every mover is a `while` row; every
  riser has a journal row by class

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

As T2.

## Commit

`feat(altp-T4): draw a while's connections and break weldings as the jar does`
