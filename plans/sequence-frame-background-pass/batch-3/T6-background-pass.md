# T6 — The background pass

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is the spec.
**Open the method body.** Sequence pixels come from `sequencediagram/teoz/`;
`sequencediagram/graphic/` is DEAD.

`teoz/PlayingSpaceWithParticipants#drawU:218-227` runs five passes:

| # | Upstream | Line | `renderer.ts` today |
|---|---|---|---|
| 1 | `playingSpace.drawBackground(ugBody)` | :218 | **MISSING** |
| 2 | `livingSpaces.drawLifeLines(ugBody, …)` | :221 | step 1 |
| 3 | `livingSpaces.drawHeads(ug, BOTTOM)` | :223 | step 2 |
| 4 | footbox `drawHeads(…, TOP)` | :224-225 | step 3 |
| 5 | `playingSpace.drawForeground(ugBody)` | :227 | step 4 |

Note the port's existing "step 0, box backgrounds" is NOT pass 1 — it is the
participant englober, and `ComponentRoseEnglober` is never referenced under
`sequencediagram/`. Leave it where it is.

T3, T4 and T5 have built everything this task needs. This task wires it.

Read `../README.md` and `../decisions.md` first. **D1** governs this task.

## Task

In `src/diagrams/sequence/renderer.ts`:

1. Give the event walk an `isBackground` flag:
   `renderEvent(event, theme, isBackground)`. Every kind returns `''` when
   `isBackground` is true **except** `frame`. That is not a special case — it
   mirrors `AbstractComponent#drawBackgroundInternalU`'s empty default, which
   is why messages, notes and arrows are silent in the jar's background pass
   without anyone checking a flag. Say so in a comment.
2. Insert the background walk **between** the box backgrounds and the lifeline
   pass, over the SAME `scaledGeo.events` array in the SAME order — upstream's
   `drawUInternal` is literally shared between the two passes.
   Background frame emission is `renderFrameBlotter(...)` then
   `renderGroupingHeaderBackground(...)`, in that order (`GroupingTile#drawU`
   calls `drawBackground` before `comp.drawU`).
3. **(D9, 2026-08-28.)** The three `FrameGeo` literals at
   `tests/unit/sequence/renderer.test.ts:716,734,751` were updated by T5, not
   you. You still own that file for your OWN new tests.
4. Replace `renderFrame`'s inline drawing with
   `renderGroupingHeaderForeground(...)` plus the existing
   `renderRefBody` / `renderBranchSeparators`. Delete
   `computeFrameTabGeo` and `renderFrameTab` — T4 owns that now, and
   `renderer.ts` must stay under the hook-enforced 500-line limit (it is at
   500 today).

## Read-set

- `src/diagrams/sequence/renderer.ts:230-345` (the frame block),
  `:433-500` (`renderSequence`'s pass structure)
- `~/git/plantuml/.../teoz/PlayingSpaceWithParticipants.java:195-228`
- `~/git/plantuml/.../teoz/PlayingSpace.java:109-130`
- `~/git/plantuml/.../teoz/UGraphicInterceptorTile.java` (whole file — 30 lines;
  read it to see that it suppresses NOTHING)
- `~/git/plantuml/.../skin/AbstractComponent.java:136-148`
- `../batch-2/T3-blotter.md#interface-contract`,
  `../batch-2/T4-grouping-header.md#interface-contract`

## Interface contract

Consumes T3's `renderFrameBlotter` and T4's two half-renderers. Produces the
final SVG body. No new exports.

## Architecture decisions (locked)

- **D1** — one shared walk, run twice with a flag. A background-only walk over
  a filtered frame list was rejected as structurally divergent; do not
  reintroduce it.
- **D6** — geometry numbers are a non-goal. If a fixture is close but the
  coordinates are wrong, that is expected and not yours to fix.

## Acceptance criteria

- Given `pixopo-04-zitu732`, when rendered through
  `tests/oracle/svg-conformance/render-fixture-sequence.ts` with
  `DeterministicMeasurer` and `fixtureIncludeStore()`, then the root `<g>`'s
  first child is a `<rect>` and its child count is **20**, matching the golden.
- Given `kejoke-76-curu931` likewise, then the child count is **102** and the
  first twelve children are all `<rect>`.
- Given a diagram with no frames, then the background walk contributes `''`
  and the output is byte-identical to before this task.
- Given the background pass, then messages, notes, activations, dividers and
  spaces emit nothing in it.
- Given a nested group, then the background pass emits outer band, outer
  outline, inner band, inner outline — in that order.

**If either of the first two criteria misses, STOP (stop condition 6).** Those
numbers are where the mission's scope came from; missing one means the scope
measurement was wrong, and the answer is to re-derive the plan, not to patch
the renderer until the number appears. **Never fit a value.**

## Observability

This is the task that moves the corpus. After it, run
`npx jiti scripts/sequence-ratchet-adjudicate.ts` against the batch parent and
report the verdict split. Do **not** re-pin (D8 — that is T9, orchestrator
only). Do **not** read raw diff counts as fidelity
(`../prior-observations.md` §1).

## Rollback

Reversible. Renderer-only; reverting restores the prior output exactly.

## Quality bar

The four gates exit 0. `renderer.ts` must end **under 500 lines** — the
complexity hook blocks the write otherwise. 90/90/90. No Prettier.

## Commit

`feat(T6): draw grouping frames in the background pass`
