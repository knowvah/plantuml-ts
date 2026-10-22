# sdd2 T3c — group frame extents

## Observation: a group frame is known only after its walk
- **Context**: porting `GroupingTile`'s min/max (`teoz/GroupingTile.java:186-225`).
- **Finding**: the frame's x/width/tabRuns and every ElseGeo's x/width/runs are
  placeholders until `resolveFrame` runs after `walkBranches`. Child spans come
  from events (messages, exo, life events incl. `++`/CREATE) and from the geo
  slice the walk pushed (notes, delays, dividers, newpage, refs, nested groups
  via a WeakMap registry in `sequence-layout-frame-extent.ts`).
- **Impact**: anything reading a group FrameGeo's x during its own walk would
  see 0. Nothing does today.
- **Confidence**: High

## Observation: GroupingTile.addConstraints is unported
- **Context**: caciga/carose/codeti/koneju/vajoke stayed at ws 78 after T3c.
- **Finding**: `ensureFollowingParticipantClearsFrame` /
  `ensurePrecedingParticipantClearsFrame` (`GroupingTile.java:367-666`) push
  the participant next to a group past its frame (+MARGINX+EXTERNAL_MARGINX2,
  self loops, title). The participant solver has no such constraint.
- **Impact**: the remaining frame-row x residuals are participant placement,
  owned by `sequence-layout-participant-constraints.ts`.
- **Confidence**: High (mechanism read; residual not re-measured with a fix)

## Observation: the event context has no x origin
- **Context**: DividerTile/NewpageTile/empty-group read `TileArguments#getXOrigin`.
- **Finding**: `EventProcessingContext` carries no `originX`; T3c uses the
  leftmost lifeline box (`xorigin.addAtLeast(0)`), equal unless a constraint
  pushed the first participant.
- **Impact**: exact only once `originX` is threaded from `layout.ts`.
- **Confidence**: High
