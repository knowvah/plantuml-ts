# T2 — Wrap activations and hoist them into the lifeline pass

## Context

Same mission context as [T1](./T1-lifeline-group.md) — read its Context
section. T1 has landed, so `renderer-lifeline.ts` exists and lifeline groups
already emit.

Two divergences remain on activations, and they compound:

1. **Shape** — the jar emits `<g><title></title><rect …/></g>`; the port emits
   a bare `<rect>`.
2. **Position in the child sequence** — the jar draws liveboxes *with* the
   lifelines, before the participant heads
   (`teoz/PlayingSpaceWithParticipants.java:221`); the port emits them inside
   the event pass, after the heads and interleaved with the messages.

Fixing only the shape leaves the index misaligned, so the fixture gains
nothing. Both halves are this task.

## Task

**Shape.** Wrap the activation rect in `<g><title></title>…</g>`. The title is
**empty** — an empty `Display` yields `""` from `toTooltipText`
(`Display.java:602-603`), and the golden confirms `<title></title>` with an
explicit closing tag, not a self-closed `<title/>` and not an omitted title.

**Zero-height suppression precedes the group.**
`ComponentRoseActiveLine.java:76-79`:

```java
if (dimensionToUse.getHeight() == 0)
    return;
ug.startGroup(UGroup.singletonMap(UGroupType.TITLE, stringsToDisplay.toTooltipText()));
```

A zero-height activation emits **nothing at all** — not an empty `<g>`.
Note this differs from T1's lifeline, where the group is emitted and only the
rect is suppressed. The two components guard at different points; mirror each
one as written rather than unifying them.

**Order.** Move activation emission out of `renderSequence`'s step 3 event
pass into the lifeline pass (step 1), so the child sequence becomes:

```
box backgrounds → [lifeline g …] [activation g …] → heads → …
```

Establish the relative order of lifelines and activations from the golden and
from `LivingSpaces#drawLifeLines` — do not guess it. In
`celego-19-laji937`'s golden the two lifeline groups precede the single
activation group; confirm whether that holds for a multi-activation fixture
before generalising, and record what you find.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseActiveLine.java`
  — whole file; `drawInternalU` at `:71-105` is the spec.
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/PlayingSpaceWithParticipants.java:196-228`
  — the draw order.
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LivingSpaces.java`
  — `drawLifeLines`, for the lifeline/livebox interleave.
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LiveBoxes.java`
  and `LiveBoxesDrawer.java` — how liveboxes reach that pass.
- `test-results/dot-cache/sequence/celego-19-laji937/in.svg` — the golden.
- A second, multi-activation fixture of your choosing from
  `tests/corpus/sequence/` — name it in the journal.
- `src/diagrams/sequence/renderer.ts` and `renderer-lifeline.ts` as they stand
  after T1.

## Write-set

- `src/diagrams/sequence/renderer-lifeline.ts`
- `src/diagrams/sequence/renderer.ts`
- tests under `tests/unit/sequence/`

## Architecture decisions — locked

D4, D6, D7 in [`../decisions.md`](../decisions.md).

The activation's `10` width is upstream's `getPreferredWidth`
(`ComponentRoseActiveLine.java:114-116`) and already matches the port's
`ACTIVATION_HALF_WIDTH * 2` — **verify that equality rather than assuming
it**, and if it does not hold, that is a finding to log, not a number to
adjust.

## Quality bar

- A test asserting a zero-height activation emits **nothing** — this is the
  branch most likely to be got wrong, and it is invisible in a golden diff
  because absence looks like absence.
- A test asserting the child order: activation groups follow lifeline groups
  and precede the first head `<rect>`.
- All four gates green.
- Measure per the batch protocol; **read the diff records**.

## Boundaries

**Always**: quote the Java `file:line` for every claim about draw order.
**Never**: unify the two components' guards because they "look the same" —
they guard at different points, and losing that distinction is exactly the
redundant-looking branch CLAUDE.md says not to collapse.
**Never**: move a coordinate to make a score fall.

## Commit

`feat(T2): wrap activations and draw them with the lifelines`
