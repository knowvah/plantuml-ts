# Batch 2 — Clip once, in `solve()`'s edge pass (serial)

The mission's main event, and its only source change. Port
`DotStringFactory.solve`'s edge loop as a named pass: clip every
composite-anchor transition once, after node geometry is final, before the ink
walk and before the renderer. Delete `clipTransitionPoints` from the ink walk
so the clip cannot happen twice or in one place only.

**Consumers follow automatically, and that is the point.** Once
`TransitionGeo.points` is clipped, `transitionArrowheadInk` and
`buildTransitionArrowhead` inherit the clipped path — which is what upstream
does (`SvekEdge.java:671-672` reassigns `dotPath`, `:679-684` builds both
extremities from it). The doc comments that currently explain the ink-only
asymmetry describe a world that stops existing here and must be corrected.

**This moves drawn output**, more than SI31 did: the curve itself changes, not
only the canvas around it. SI31's four ink-only movers are the floor.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Port the pass, clip once, delete the ink-walk clip, correct the consumers' docs and tests | general-purpose (opus) | `src/diagrams/state/layout.ts`, `src/diagrams/state/layout-ink-transition.ts`, `src/diagrams/state/layout-ink-extent.ts`, `src/diagrams/state/renderer-arrowhead.ts`, the composite-pass file(s) T1 identifies, their tests, `plans/state-anchor-clip-retire/expected-moves.txt` | T1 | [ ] |
