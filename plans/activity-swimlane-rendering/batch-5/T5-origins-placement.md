# T5 — Lane origins and node placement

**Agent:** `typescript-pro` · **Depends on:** T4

## Context

Read [`../README.md`](../README.md) and
[`../decisions.md#d1`](../decisions.md). Today `assignCoordinates`
(`tile-coordinates.ts:328-395`) computes lane geometry as a decorative
overlay and `walkTile` places every node in one column. On
`pakema-21-xema183` our `:b;` lands at x=132 — exactly ON the lane-2
boundary — where the jar puts it at x=201.469, inside lane B.

## Read-set

- `src/diagrams/activity/layout/tile-coordinates.ts:328-395` — the whole
  `assignCoordinates`, including the swimlane bounds block added by
  `fix/activity-canvas-bounds` (`1ccfd281`) which this task must keep true
- `src/diagrams/activity/layout/swimlane-context.ts` — T4's output
- `~/git/plantuml/.../ftile/Swimlanes.java:318-350` — the divider/translate
  loop, for how lane origins accumulate
- `tests/diagrams/activity/layout/canvas-bounds.test.ts` — must stay green

## Task

1. Assign each lane an origin from the cumulative widths of the lanes
   before it.
2. Offset each tile's x by its lane's origin during the walk, so a node
   lands inside its own lane.
3. Retire `SWIMLANE_MIN_WIDTH`. If a floor is genuinely needed, source it;
   otherwise delete it (upstream's `MinimumWidth` default is `0`,
   `style/ValueNull.java:61-63`).

## Boundaries

**Always:** keep the canvas containing every drawn extent — the bounds
block already added for swimlanes must remain correct as widths change.
**Never** touch `renderer.ts` (T6 owns it) or the superseded engine.
**Ask first (halt and journal):** if nested constructs (if/while/fork/split)
spanning lanes need restructuring — stop condition 7.

## Acceptance criteria

- Given `pakema-21-xema183`, when laid out, then `:b;` sits strictly inside
  lane B rather than on its boundary
- Given a two-lane diagram, then lane B's origin equals lane A's width plus
  lane A's origin
- Given `canvas-bounds.test.ts`, then it stays green — the canvas still
  contains every drawn extent
- Given a diagram with no swimlanes, then geometry is byte-identical to
  before this task
- Given the ratchet, then any risen fixture is named with a mechanism in
  the journal before the commit lands

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates green; full `npm test`.

## Commit

`feat(asr-T5): place activity nodes inside their swimlane`
