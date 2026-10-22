# sdd2 T3c2 — origin, parallel chains, participant clearance

## Observation: the participant row may not import the event walk
- **Context**: porting GroupingTile#addConstraints into the constraint scan.
- **Finding**: participants -> constraints -> (anything reaching) sequence-layout-events.ts -> sequence-layout-exo.ts -> participants is a load-time cycle; exo's top-level `const BORDER1 = LEFT_MARGIN` throws a TDZ ReferenceError. sequence-layout-message-self.ts imports activationLevel via events.ts, so even SELF_ARROW_X_RIGHT drags the walk in.
- **Impact**: modules the participant row imports must be leaves; the fix is message-self importing from sequence-layout-activation.ts.
- **Confidence**: High (probe: the one-line path change removes the crash)

## Observation: a message's `++`/`--` are LifeEventTiles of their own
- **Context**: rugeco-70, a `&opt` after `b ->> c ++`.
- **Finding**: the jar places the group below the message and does not keep it disjoint from it: the LifeEventTile (createPropagating, height 0, no anchor) is the previous tile and closes the `&` run (PlayingSpace.java:188-202,281-298).
- **Impact**: any `&` logic keyed on "the previous tile" must treat own life events as tiles.
- **Confidence**: High

## Observation: `& message` after a group has a y residual
- **Context**: probe `opt a->b; b->b end; & c -> d`.
- **Finding**: jar lifelines 100 tall vs ours 45; x matches. Not investigated.
- **Confidence**: Medium
