# T6 — repeat connections and the back-edge side

**Agent:** typescript-pro · **Depends on:** T5

## Context

Faithful port; the Java is the spec. Read [`../README.md`](../README.md),
[`../decisions.md`](../decisions.md) D5, D6, D7, D8 (quoted), the T5
contract, and T4's `walk-while-branch.ts` as the shape.

**The jar** (`vcompact/FtileRepeat.java`), `backward == null`:

- `:173-203` order: `ConnectionIn`, the back connection, `ConnectionOut`.
- `ConnectionIn` (`:221-274`): `p1 = entry pointOut`, `p2 = body pointIn`;
  if `p1.x != p2.x` a dog-leg at `my = (p1.y + p2.y)/2`; `asToDown`,
  label `tbin1` (the body's in-link display).
- Back selection (`:186-199`): `swimlane == null || swimlane ==
  swimlaneOut` -> `Simple1` iff `swimlane != null &&
  swimlane.isSmallerThanAllOthers(repeat.getSwimlanes())` else `Simple2`;
  otherwise `Complex1` -> **stop 11**. `repeat.getSwimlanes()` is the set
  of lanes the BODY touches (`getSwimlanes`, `:49-57` without `diamond1`/
  `diamond2` — read it); the predicate is `isMainLaneSmallerThanAllOthers`
  (`layout/conditional-builder.ts:243-262`, `Swimlane.java:130-137`) —
  export it (or move it to `layout/swimlane-predicates.ts`, pre-authorised).
- `ConnectionBackSimple2#drawU` (`:626-648`): `x1 = d2.x + d2.w`, `y1 =
  d2.y + d2.h/2`, `x2 = d1.x + d1.w`, `y2 = d1.y + d1.h/2`; points `(x1,y1)
  -> (xmax, y1) -> (xmax, y2) -> (x2, y2)`, `xmax = width - 12`;
  `asToLeft`, `emphasizeDirection(UP)`, label `tbback`
  (`arrowHorizontalAlignment()`).
- `ConnectionBackSimple1#drawU` (`:555-577`): `x1 = d2.x`, `x2 = d1.x`,
  same y's; `xmin = -12`; `asToRight`, `emphasizeDirection(UP)`.
- `ConnectionOut` (`:275-332`): skipped when the body has no pointOut;
  `p1 = body pointOut`, `p2 = diamond2 pointIn`; two points, `asToDown`,
  label `tbout1`.
- `UEmpty(5, 12)` sites: grep `UEmpty` in `FtileRepeat.java` and port each
  as a reservation.

**Ours.** `walk-repeat.ts` (T5) still draws the awrl-era back edge on the
left via `GConnectionDownThenUp` from the condition's south to the body's
north.

## Fix

1. `walkRepeat`: emit In, Back (Simple1/Simple2 by the predicate; throw a
   named error for Complex1 so the stop is loud — a baseline fixture
   hitting it is stop 11), Out; `emphasize: 'up'` on the back vertical;
   labels at the jar's anchors; reservations.
2. Retire `backEdgeLeftX`; delete `routing/gconnection-down-then-up.ts` and
   `BACK_EDGE_MARGIN` if `grep` shows no reader outside `layout.old.ts`
   (D8; `layout.old.ts` and its imports untouched, stop 10).

## Write-set

`src/diagrams/activity/layout/walk-repeat.ts`,
`src/diagrams/activity/tiles/gtile-repeat.ts`,
`src/diagrams/activity/layout/conditional-builder.ts` (export only) or a
new `layout/swimlane-predicates.ts`,
`src/diagrams/activity/layout/hexagon-reservations.ts`,
`src/diagrams/activity/activity-layout-constants.ts`,
`src/diagrams/activity/routing/gconnection-down-then-up.ts` (delete if
unread) and its test; tests as T5 plus `edge-draw-order.test.ts`;
`measurements/t6.json`; journal rows; `docs/catalog.md` on drift.

## Acceptance criteria

- Given `biguku-39-voxu233`, when `--align` runs, then the back edge runs
  right at `width - 12` into the entry diamond's right side with the up
  mid-arrow, and every loop endpoint matches the golden to 0.01
- Given a repeat in lane A whose body touches only A and B (A before B),
  then `Simple1` at `x = -12`; given a body touching a lane before A, then
  `Simple2`
- Given a repeat whose `swimlane != swimlaneOut`, then the named Complex1
  error (and stop 11 if a baseline fixture reaches it)
- Given the 43 repeat rows, then line/polygon counts equal the jar's or
  the residual is named; `t6.json` vs `t5.json` movers are repeat rows;
  scan 0

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

As T2.

## Commit

`feat(altp-T6): draw a repeat's connections on the jar's side`
