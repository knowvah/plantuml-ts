# T3 — Draw the footbox before the foreground tiles

## Context

Same mission context as [T1](./T1-lifeline-group.md). T1 and T2 have landed;
lifelines and activations now emit as `<g>` groups in the lifeline pass, so the
child sequence is aligned through the participant heads.

One divergence remains. Upstream
(`teoz/PlayingSpaceWithParticipants.java:223-227`):

```java
livingSpaces.drawHeads(ug, context, VerticalAlignment.BOTTOM);
if (playingSpace.isShowFootbox())
    livingSpaces.drawHeads(ug.apply(UTranslate.dy(pageHeight + headHeight)), context, VerticalAlignment.TOP);

playingSpace.drawForeground(ugBody);
```

Footboxes are drawn immediately after the heads and **before** the foreground
tiles. The port emits them **last**, after the event pass
(`renderer.ts` step 4). Confirmed in the golden: `celego-19-laji937` emits
head A, head B, tail A, tail B, then the two messages.

This is a z-order divergence as well as an index one — upstream lets an arrow
paint over a footbox, the port paints the footbox over the arrow.

## Task

Move the `showFootbox` block from after the event pass to immediately after
the participant-header pass. Nothing else changes: same geometry, same
`isShowFootbox` resolution, same `footerShapeY`.

Then verify the full child sequence for `celego-19-laji937` matches the
golden's tag-for-tag, and say so with the evidence — this is the task where
the mission's premise either holds or does not.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/PlayingSpaceWithParticipants.java:196-228`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LivingSpaces.java` — `drawHeads`
- `src/diagrams/sequence/renderer.ts:465-512`
- `src/diagrams/sequence/layout.ts` — `isShowFootbox`, for the resolution it
  already does at layout time (do not re-resolve it here)
- `test-results/dot-cache/sequence/celego-19-laji937/in.svg`

## Write-set

- `src/diagrams/sequence/renderer.ts`
- tests under `tests/unit/sequence/`

## Architecture decisions — locked

D5, D6, D7 in [`../decisions.md`](../decisions.md).

## Quality bar

- A test asserting footbox rects precede the first arrow `<polygon>` in the
  emitted body.
- All four gates green.
- **The batch-closing measurement.** Report Σ weightedScore across the 1124
  numeric fixtures against the 1 291 577 start-of-mission baseline, the
  fixture counts that fell / held / rose, and — for `celego-19-laji937` — the
  full remaining diff record list. If arrow attributes now appear in that list
  where none did before, that is the mission's thesis confirmed; say so with
  the records, not as a summary.

## Boundaries

**Always**: report what the measurement actually shows, including a
disappointing result. A stated non-result is worth more here than an
optimistic one.
**Never**: adjust geometry to improve the number.

## Commit

`feat(T3): draw the sequence footbox before the foreground tiles`
