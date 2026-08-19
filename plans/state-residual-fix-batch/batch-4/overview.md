# Batch 4 — G5 south-cap opacity thread (serial)

When a state composite's south background is non-transparent, the jar draws
the south cap as a `UPath`, and `LimitFinder#drawUPath` applies **zero** ink
inset where `drawRectangle` applies −1 on both corners — so the cap's ink
reaches the composite's full height, 1 px past the outline rect's inset max.
Our ink walk has no south-cap term at all. Five fixtures, −1.000 px each.

SI29 deferred this because `StateNodeGeo` carries no resolved colour to gate
the +1 on, and applying it unconditionally regressed nine previously-exact
default-styled fixtures.

**This batch opens with a pre-condition, not with code.** The +1 px is
source-verified; what *gates* it is not. Settle that first — stop 9.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Settle the opacity gate against the Java, then thread a south-opacity boolean to the ink walk and apply the +1 | general-purpose (opus) | `src/diagrams/state/state-geo-types.ts`, `src/diagrams/state/state-composite-pass.ts`, `src/diagrams/state/state-composite-pass-types.ts`, `src/diagrams/state/state-composite-geo.ts`, `src/diagrams/state/layout-ink-extent.ts`, their unit tests | T3 | [ ] |
