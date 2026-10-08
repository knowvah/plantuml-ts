# unwind2-S4 — newpage lifeline end vs footbox top

## Observation: lifelines and footbox are two quantities per page
- **Context**: Retiring DIVERGENCES.md "The one pixel this costs".
- **Finding**: `PlayingSpaceWithParticipants#drawU` (teoz, :213-226) draws
  lifelines over `fullHeight` inside `UClip(-1000, ymin, MAX, pageHeight + 1)`
  and puts the footbox at `dy(pageHeight + headHeight)`. Jar renders
  (`tests/fixtures/unwind2-S4/*.svg`) confirm: inner page footbox y=95,
  lifeline y2=96 and hover rect height +1; the last page has no gap.
  `SequenceGeometry.footerShapeY` now carries the footbox top and
  `lifelineEndY` the clipped lifeline end (`sequence-page.ts`).
- **Impact**: Fixes 4 diffs on Sequence-delay-destroy-newpage-style, makes 11
  survey fixtures numerically exact (maxDelta 1 -> 0).
- **Confidence**: High

## Observation: delay (`...`) ink is entirely unported in sequence
- **Context**: giloko-85-gapa789 weightedScore rose 261 -> 263 after the fix.
- **Finding**: `MutingLine#drawLine` (teoz/MutingLine.java:73-92) splits
  each lifeline at every delay into a solid segment, a DELAY_LINE dotted
  segment (`stroke-dasharray:1,4`, no title group) and a trailing segment.
  This port's `handleDelayEvent` only advances the cursor: no delay geometry,
  no dotted segment, no delay text. In giloko a delay starts exactly at the
  page-0 clip edge, so the jar's SOLID segment ends at ymax while the dotted
  one is clipped to ymax+1; our single solid line now ends at ymax+1.
  Same mechanism moves luzapi-49-rati107's misaligned maxDelta 179 -> 180.
- **Impact**: Porting delay ink (MutingLine split + DelayTile text) is the
  follow-on that removes that rise; not a page-geometry defect.
- **Confidence**: High

## Observation: delay ink ported (follow-on to the entry above)
- **Context**: Orchestrator asked to port MutingLine/DelayTile so giloko stops rising.
- **Finding**: `DelayTile` ALWAYS builds `DELAY_TEXT` (DelayTile.java:84-88), so a
  bare `...` is 28 tall (empty block + 4+4 padding + 20), not 20 as the port
  had; `......` is also 28 because `AbstractTextualComponent:86-87` turns one
  empty line into `TextBlockEmpty`. Delays are registered in the background
  pass, before `drawLifeLines`, so every lifeline is cut. Activation bars are
  cut by `Segment#cutSegmentIfNeed` and drawn open (back-colour rect + sides).
  A page clip drops a `DELAY_LINE` but leaves an EMPTY `<g><title>` for a
  clipped-out `PARTICIPANT_LINE`. Code: `src/diagrams/sequence/sequence-delay.ts`.
- **Impact**: weightedScore 0 rises / 67 falls across 1127 fixtures. Two
  pre-existing gaps now show through the cut: `create` lifelines start at the
  head row (upstream starts them at the create y, `LivingSpace#
  drawLineAndLiveboxes` aliveChanges), and `return` not closing an
  activation in kukeja-88-zida141 -- both add pieces the jar does not draw.
- **Confidence**: High
