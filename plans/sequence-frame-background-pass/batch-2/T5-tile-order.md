# T5 — Tile order + colour carry-through

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is the spec.
**Open the method body.** Sequence pixels come from `sequencediagram/teoz/`.

Upstream draws a grouping frame's chrome BEFORE its children:
`GroupingTile#drawU:256-275` emits the component, then `drawNotes`, then
`for (Tile tile : tiles) tile.drawU(ug)`. And `PlayingSpace#drawUInternal`
walks only TOP-LEVEL tiles (`GroupingTile.fillPositionelTiles:760-769` puts
nested tiles in `full`, used for anchors, never in `local`), so a GroupingTile
draws itself as a unit and recurses. The net emission order is a **depth-first
pre-order** walk.

This port's `handleFrameEvent` pushes its `FrameGeo` AFTER recursing into the
branches, so every frame lands after its own contents. Verified in
`kejoke-76-curu931`: the golden puts each group's `path,rect,text` immediately
before that group's messages; ours puts `rect,rect,text,text` after them.

Read `../README.md` and `../decisions.md` first. **D2** governs this task.

## Task

In `src/diagrams/sequence/sequence-layout-events.ts#handleFrameEvent`:

1. **Push the `FrameGeo` into `ctx.eventGeos` BEFORE the
   `event.branches.forEach` recursion**, then fill `y`, `height`,
   `branchSeparators` and `refBody` in place once the branches resolve (D2).
   Document the mutation contract on the fields — this mirrors upstream's own
   construct-then-resolve-gauge two phases, and `CLAUDE.md` licenses in-place
   mutation where upstream mutates.
2. Carry `backColorElement` / `backColorGeneral` from the `FrameEvent` (T2)
   onto the `FrameGeo`, and each branch's own colour onto its
   `branchSeparators` entry.
3. Populate the header-Display fields using `ctx.measurer`, which is the only
   stage that has one:
   - `groupingHeaderDisplay(...)` from `frame-style.ts` gives `tabText` /
     `tabComment`
   - `tabTextWidth = ctx.measurer.measure(tabText, <13px bold spec>).width`
   - `tabWidth = HEADER_PADDING.left + tabTextWidth + HEADER_PADDING.right`
     (`getPreferredWidth:110-121` with `commentTextBlock == null`)
   - `tabHeight = textHeight + 2 * paddingY` (`getPreferredHeight:124-126`)

4. **(D9, 2026-08-28.)** Update the three `FrameGeo` object literals at
   `tests/unit/sequence/renderer.test.ts:716,734,751` so they carry the tab
   fields T1 made required. These moved here from T6 because they construct a
   `FrameGeo` and this is the task that changes `FrameGeo` construction. They
   are the last of the four `TS2739` errors T1 left behind — **this batch must
   return `npm run typecheck` to exit 0.** Touch nothing else in that file;
   T6 still owns it for its own new tests.

Do NOT change the renderer. Do NOT change frame `x`/`width` geometry — that is
a non-goal (D6).

## Read-set

- `src/diagrams/sequence/sequence-layout-events.ts:147-192`
  (`handleFrameEvent`)
- `~/git/plantuml/.../teoz/GroupingTile.java:256-275` (`drawU`),
  `:760-775` (`fillPositionelTiles`)
- `~/git/plantuml/.../teoz/PlayingSpace.java:114-130` (`drawUInternal`)
- `~/git/plantuml/.../skin/rose/ComponentRoseGroupingHeader.java:110-126`
  (`getPreferredWidth` / `getPreferredHeight`)
- `../batch-1/T1-frame-contract.md#interface-contract`

## Interface contract

Produces `FrameGeo`s that are (a) positioned before their children in
`events`, and (b) carry the colour and tab fields. T6 consumes both.

## Architecture decisions (locked)

- **D2** — reserve the slot, then fill in place. Rejected alternatives are
  recorded there; do not re-litigate.
- **D6** — geometry numbers are a non-goal.

## Acceptance criteria

- Given a frame containing two messages, then
  `events.indexOf(frame) < events.indexOf(firstMessage)`.
- Given nested frames, then the order is depth-first **pre-order**: outer
  frame, inner frame, inner's children, outer's remaining children.
- Given `group foo`, then
  `tabWidth === 15 + measure('foo').width + 30` using `HEADER_PADDING`.
- Given an `alt` with two `else` branches, then each `branchSeparators` entry
  carries its own `backColorGeneral` (or `undefined` where the source gave
  none).
- Given a diagram with no frames, then `events` is unchanged element for
  element.

## Observability

This task moves rendered output: every frame changes position in the child
sequence. Expect the ratchet to move and adjudicate it at the batch gate.
**Never read a raw diff count as fidelity** — see `../prior-observations.md`
§1.

## Rollback

Reversible. Layout-only; reverting restores the prior order exactly.

## Quality bar

The four gates exit 0 — including `npm run typecheck`, which is RED when this
task starts (four `TS2739` errors deferred from T1 per D9) and must be green
when it ends. Existing `tests/unit/sequence/layout.test.ts` frame
assertions may encode the old ordering — update them to the new contract
rather than working around it. 90/90/90. No Prettier.

## Commit

`feat(T5): emit frames in tile order and carry their colours`
