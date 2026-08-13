# Observation: `MeasuredClassifier.dividerYs` means something different for a class than for a map

- **Context**: SI17 T0, deciding ADR-1 (block tree vs. flat sizer as the
  source of class `::member` port bands).
- **Finding**: `class-port-rows.ts#mapPortRows` treats `measured.dividerYs[i]`
  as data-row *i*'s top. That is true only for `map`/`json` leaves, where
  `class-map-sizing.ts#buildMapRowGeo` emits one divider per data row. For a
  classic class, `dividerYs` is the **compartment separator list** — a
  five-row class emits exactly two entries (`[32, 68]` for
  `class Foo { field1; field2; method1(); method2() }`). Indexing it by row
  runs off the end and silently drops the band.
  Relatedly, `ClassifierGeo.rows[].y` is a text **baseline**, not a row top:
  `class-member-rows.ts:200` computes `sectionTop + SECTION_MARGIN_TOP +
  rowTop + baselineOffset` and publishes only the sum, so neither the row top
  nor the row height is recoverable from `MeasuredClassifier`'s surface.
- **Impact**: Any future work that reads per-member geometry off
  `MeasuredClassifier` (ports, hover regions, per-row links, inner positions)
  must not generalize the map recipe. The class engine's per-member tops
  exist only as a local in `buildSectionRows`. Widening
  `MeasuredClassifier` — or going through the ported block tree, which is
  what upstream does — are the two honest options; subtracting an
  unattributed ascent is fitting.
- **Confidence**: High — measured via `measureClassifier` on four fixtures and
  cross-checked against jar oracle DOT and SVG.

## Observation: no class port fixture in the corpus has two member compartments

- **Context**: same task; looking for the discriminating control.
- **Finding**: all 22 slugs in `oracle/goldens/class/port-backlog.json` were
  scanned for a class with both a field and a method compartment plus an
  elected port. Zero hits. The two apparent hits are heuristic false
  positives: `bicabi-42-coto932` has fields+methods but zero elections (it is
  the zero-election control), and `juxora-90-fisu720`'s "methods" are the
  emoticon `prop4 :(` inside a `|_` enhanced body. The brief's suggested
  candidate `xefeme-77-fagu709` is fields-only.
- **Impact**: The multi-compartment offset (fields block height flowing into
  the methods compartment via `TextBlockVertical#getPorts`,
  `klimt/shape/TextBlockVertical.java:107-118`) has **no corpus coverage**.
  A regression there would go unnoticed by the DOT gate. SI17 should land an
  authored fixture + oracle for it; the `.puml` used in T0 is recorded
  verbatim in `plans/si17-class-row-ports/decision-journal.md`.
- **Confidence**: High.
