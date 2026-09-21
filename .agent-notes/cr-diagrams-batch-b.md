# Code-review batch B (diagrams) — 2026-09-21

## Observation: chronology diagram has no upstream implementation at all
- **Context**: item 6 (uncited constants) required finding upstream Java
  sources for `chronology/layout.ts`'s canvas constants (TOTAL_WIDTH,
  HEADER_HEIGHT, BASELINE_Y, TOTAL_HEIGHT).
- **Finding**: `ChronologyDiagramFactory` is commented out in
  `PSystemBuilder.java:184` (`// factories.add(new
  ChronologyDiagramFactory());`), and no
  `net.sourceforge.plantuml.chronology` package exists anywhere in
  `~/git/plantuml` — only the `DiagramType.CHRONOLOGY` enum entry and its
  `chronology` keyword parser survive (`core/DiagramType.java:46,109-110,
  286`). `plans/chronology-diagram/decisions.md`'s D5 cites a
  `TimeScaleChronology.fullWidth` class that does not exist anywhere in the
  jar (confirmed by `find`/`grep` across the whole source tree).
- **Impact**: every chronology layout/render decision in this port is
  necessarily port-own — there is no jar to diff against, ever, for this
  diagram type until upstream ships a real implementation. Future missions
  touching chronology should not search for a Java counterpart; the D5
  citation in decisions.md should be treated as aspirational/incorrect, not
  as a verified source.
- **Confidence**: High (direct grep/find against `~/git/plantuml`, not
  inference).

## Observation: board diagram's shadow rendering technique already diverges from upstream
- **Context**: item 1 (deterministic shadow filter id) asked to check
  whether upstream board draws a shadow/filter at all.
- **Finding**: upstream draws the card shadow via
  `URectangle#setDeltaShadow(1)` (`board/CardBox.java:74`) — a solid
  offset-rectangle shadow, not an SVG `<filter>`. This port's
  `buildShadowDefs` (Gaussian blur + feOffset + feBlend) is a pre-existing,
  undocumented rendering-technique divergence, unrelated to the
  `Math.random()` defect this batch fixed. Documented inline
  (`board/renderer.ts`'s `buildShadowDefs` doc comment) but NOT changed —
  reconciling the two rendering approaches is a separate, larger visual-diff
  task, out of scope for this fix.
- **Impact**: a future mission reconciling board's shadow rendering with
  the jar should expect a real geometry delta (solid offset rect vs.
  blurred filter), not just an id-format change.
- **Confidence**: High (read `board/CardBox.java` directly).
