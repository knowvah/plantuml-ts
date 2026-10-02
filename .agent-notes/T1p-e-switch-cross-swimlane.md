## Observation: switch+swimlane fixture shows duplicate case-row geometry in the jar
- **Context**: Mission `activity-divergence-drive-2`, batch 1p, T1p-e
  (port `FtileSwitchWithManyLinks.java:297-end`'s cross-swimlane
  connectors). Authored `tests/fixtures/activity/T1p-e/switch-cross-
  swimlane.puml` (no corpus fixture exercises `switch` across swimlanes)
  and rendered it through `scripts/oracle-render.sh` to get a ground-truth
  oracle SVG for the connector geometry.
- **Finding**: The oracle SVG draws the switch's `:A;`/`:B;` case boxes
  TWICE each -- once at Lane1's x-offset (`x=26`/`x=104`, `y=145.056`) and
  once at Lane2's x-offset (`x=142`/`x=180`, same `y`), byte-for-byte
  identical geometry in both copies. This is NOT our port's current
  behavior (our port places each case box exactly once, in whichever lane
  it is tagged with). Hypothesis, NOT yet confirmed by instrumenting the
  Java (no debug trace run; diagnosis.md's "ruled out" bar is not met):
  `Swimlanes.java#drawWhenSwimlanes` re-walks the ENTIRE diagram tree once
  per lane (`full.drawU(new UGraphicInterceptorOneSwimlane(ug, swimlane,
  ...))`), relying on that interceptor's `shape instanceof Ftile` branch to
  gate each LEAF tile's draw by swimlane membership. But
  `FtileSwitchWithDiamonds#drawU` (`:132-145`) calls `tile.drawU(ug.apply
  (...))` DIRECTLY on each case tile -- a plain method call, not a `ug
  .draw(tile)` dispatch -- so the interceptor's `Ftile` branch never sees
  that call and never filters it. If true, every lane's pass redraws every
  case tile at that lane's own translate, producing one visible copy per
  lane regardless of the tile's actual swimlane tag.
- **Impact**: This is orthogonal to (and larger than) T1p-e's own scope
  (the two `*CrossSwimlane` CONNECTOR shapes) -- it is a node-placement
  divergence in the switch builder's own `drawU`, not a connector gap.
  Before any fix is attempted here or in a follow-on mission: instrument
  `FtileSwitchWithDiamonds#drawU`'s `BIG_DIAMOND`/`SMALL_DIAMOND` branch
  selection for this exact fixture (confirm which mode fires and whether
  `SMALL_DIAMOND`'s `super.drawU(ug.apply(getTranslateMain(...)))` path
  also bypasses the interceptor), per `diagnosis.md`'s "mechanism before
  fix" bar. CLAUDE.md's "preserve information-carrying output... including
  behavior that looks like a bug" applies if confirmed -- this would need
  to be REPRODUCED, not fixed, unless proven to be upstream's own defect.
- **Confidence**: Medium (SVG evidence is solid; the `drawU`-bypasses-
  interceptor mechanism is a plausible reading of the Java, not confirmed
  by a debug trace).
