# Batch 3 — the actual fix

One task, and the point of the mission.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T4 | draw usecase/actor via `EntityImageDescription.drawU` | typescript-pro | `src/diagrams/class/renderer.ts`, `src/core/usymbol-shapes.ts`, `tests/oracle/svg-conformance/class-usecase-actor.test.ts` | T1, T3 | [x] |

## The one-line summary

Stop reconstructing the drawing from `{width, height}`. Construct the same
object the sizer constructed, and call `drawU` on it — which is what
`description/renderer-entity.ts:387` already does and what `SvekNode` does
upstream.

## Expected movement

This is the **only** batch expected to move a golden, and only the three
authored usecase/actor fixtures. The 312 class goldens contain no usecase,
actor or sprite (SI10 verified this), so any movement there means the change
reached further than intended — treat it as a stop, not as a re-pin.

## Success signal

On `class-usecase-inline-sprite`, both `text/@x` and `image/@x` reach delta 0
(today: 2.003), and the label baseline becomes content-dependent instead of the
constant `cy + 2.6667`. The `ry` delta (13.4846 vs 13.0625) is a **different
mechanism** and is expected to survive this batch — T6 diagnoses it. Do not
chase it here.
