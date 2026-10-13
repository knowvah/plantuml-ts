# T5b: the legend merges the diagram's style name (family B)

Prepend [../task-preamble.md](../task-preamble.md). **Pre-declared `src/core/` work — runs only
after maintainer approval (stop 10, journal row 30).**

## Rows (b4 render-diff S/N)
`fipina-75-bago028` S3/N65, `xakubu-65-cumo769` S5/N30; probe `tests/fixtures/wbs/legend.puml`.

## Mechanism (T4a)
`EntityImageLegend.java:49-51` merges `root, root, document, <diagram.getStyleName()>, legend`,
so the `wbsDiagram { FontSize 12; RoundCorner 0; LineThickness 1.5; Padding 10; Margin 15 }`
block (`plantuml.skin:350-356`) reaches the legend; the port's
`src/core/annotations/style.ts:96-140 resolveAnnotationStyles` starts from diagram-agnostic
`BASE_DEFAULTS`, so we draw rx 7.5 / stroke 1 / font 14 where the jar draws no rx / 1.5 / 12
(canvas 5×14 px smaller). Read `EntityImageLegend.java`, `UmlDiagram#getStyleName` /
`TitledDiagram` and how the port threads a diagram's style name into annotations today (other
engines — mindmap `mindmapDiagram`, salt — share this path: instrument them first).

## Task (TDD)
Failing test first with the jar's legend `<rect>`/`<text>` from the two cached rows; thread the
diagram's style name into the legend's style signature at its Java origin. **Whole-corpus hash
diff** before/after: legends appear in many engines; every non-wbs mover needs a mechanism (a
mover toward the jar is a reveal; a conformant loss is stop 4).

## Write-set
`src/core/annotations/{style,annotation-style-overrides,annotation-style-types,blocks,chrome}.ts`
(only what the mechanism needs), `src/diagrams/wbs/index.ts` (pass the style name if the seam
is per-plugin), their unit tests, `docs/catalog.md`, `.agent-notes/wep-T5b.md`,
`plans/wbs-engine-port/measurements/T5b/**`. Any other file is a stop.

## Acceptance
- Given fipina and xakubu, then survey-conformant.
- Given the hash diff, then every non-wbs mover has a mechanism and none loses conformance.

**Observability:** N/A. **Rollback:** Reversible.
