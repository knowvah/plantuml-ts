# Batch 2 — Clip once per layout result (serial)

> **Amended 2026-08-19 after T1's stop 9.** This batch originally ported
> `solve()`'s edge loop as a single post-assembly pass. That placement is
> impossible here and is not upstream's — see `decisions.md` D1'/D1'a/D2'.
> The exit condition is unchanged: clip once, then measure and draw the same
> path.

The mission's main event, and its only source change. Port
`DotStringFactory.solve`'s edge loop at its true scope — one layout result —
by clipping at construction inside `buildLevelTransitionGeos`, so every
`TransitionGeo` is clipped before anything holds it. Delete `clipTransitionPoints` from the ink walk
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
| T2 | Clip at construction per layout result, delete the ink-walk clip, correct the consumers' docs and tests | general-purpose (opus) | `src/diagrams/state/state-composite-pass.ts`, `src/diagrams/state/layout.ts`, `src/diagrams/state/layout-ink-transition.ts`, `src/diagrams/state/layout-ink-extent.ts`, `src/diagrams/state/renderer-arrowhead.ts`, their tests, `plans/state-anchor-clip-retire/expected-moves.txt` | T1 | [ ] |
