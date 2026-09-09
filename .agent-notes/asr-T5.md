# asr-T5 — lane origins and node placement

Mission `activity-swimlane-rendering`, batch 5 (`3d0bd2c5`). Observations
that outlive the mission; the per-fixture numbers are in the decision
journal and the close-out.

## Observation: the pinned oracles are rendered by the OLD Ftile engine

- **Context**: porting the cross-lane connector, following the brief's
  citation to a `GConnection`/Gtile class.
- **Finding**: `Gtile.USE_GTILE` is `false` in the reference jar, so
  `Swimlanes#drawU` takes the `full.drawU` branch (`Swimlanes.java:239-256`),
  and cross-lane edges are drawn by `ConnectionCross` →
  `ConnectionTranslatable#drawTranslate` — the simple case is
  `vcompact/ConnectionVerticalDown.java:87-100`. The Gtile/GConnection tree
  the brief pointed at is not what produced any committed golden.
- **Impact**: every future activity connector or ftile question reads the
  Ftile tree (`ftile/vcompact/*`) first; the Gtile classes are a different,
  unreached engine.
- **Confidence**: High — read from the Java, reproduced on `pakema`.

## Observation: the unsourced 120px action-box floor now drives lane widths

- **Context**: the first content-fitted lane widths (`Swimlanes.java:398-409`
  ported) made 25 swimlane fixtures WORSE against the jar.
- **Finding**: `ACTION_MIN_WIDTH = 120` (`tiles/gtile-action.ts`, unsourced,
  left in place by `activity-style-defaults` T4 to keep that mission's
  height derivation measurable) is the content width of almost every lane,
  where the jar's box is text + 2×10 padding (26.675 on `pakema`). The old
  equal-division overlay happened to be closer. Upstream's `MinimumWidth`
  default is 0 (`style/ValueNull.java:61-63`).
- **Impact**: the single largest residual on the 60 swimlane fixtures is not
  a swimlane defect; it is the action-box width floor, and it belongs to a
  mission that removes that floor for ALL activity fixtures at once.
- **Confidence**: High — a correct width formula over a wrong input.

## Observation: the cross-lane jog height depends on a spacing phase we lack

- **Finding**: `ConnectionVerticalDown#drawTranslate` puts the horizontal
  jog at `(p1.y + p2.y)/2`, but on the PRE-compression geometry:
  `FtileFactoryDelegatorAssembly#assembly` inserts a 35px spacer
  (`vcompact/FtileFactoryDelegatorAssembly.java:58-65`) that
  `CompressionXorYBuilder` ON_Y later removes. Our fixed `NODE_MARGIN_Y = 20`
  has no such phase, so the ported midpoint lands 5px lower than the jar's
  on `pakema`/`patagi`.
- **Impact**: any exact-Y work on activity edges has to model the
  spacer-then-compress pipeline, not tune a margin.
- **Confidence**: High for the mechanism; the compression arithmetic itself
  was not traced.

## Observation: a composite's recorded lane is the lane active at its END

- **Finding**: `if-dispatch.ts#tryIf` evaluates `swimlaneSpread(ctx)` after
  the branches are parsed, so an `if` whose branches switch lanes records
  the LAST lane, not the one its diamond was declared in (upstream's
  `getSwimlaneIn`). T5 inherits the composite's lane onto its diamonds
  knowingly.
- **Impact**: a parser defect with its own fixture class; filed at close-out.
- **Confidence**: High — verified empirically by the T3 agent.
