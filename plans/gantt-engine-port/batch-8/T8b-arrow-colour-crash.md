# T8b — `GanttConstraint` arrow colour: accept every `HColor` as the Java does

Agent: `typescript-pro` (sonnet), worktree `gep-T8b`. Commit:
`fix(gantt): pass any style arrow colour through as the jar does (T8b)`. Journal row 81.

## Symptom
Corpus row `gantt/mexito-28-toli086` (a `<style> arrow { LineColor blue }`
block plus `-[#012]->` and `-[dotted]->` constraints) crashes at draw time:
`ClassCastException: arrow colour is not an HColorSimple`
(`src/diagrams/gantt/GanttConstraint.ts:25`). The jar renders it.

## Task (diagnosis first, then the mirror)
1. Instrument: render the source through `renderSync` and record the runtime
   type/shape of the colour that reaches that throw (`style.value(LineColor).asColor(colorSet)`
   from a `<style>` block vs from `-[#012]->`).
2. Read `GanttConstraint.java:95-110` and `GanttArrow.java:105-135`
   (`style.applyStrokeAndLineColor(ug, colorSet)`, `new GArrows(atEnd, style.value(PName.LineColor).asColor(colorSet))`):
   the Java narrows nothing — any `HColor` flows into the stroke/line colour and
   `GArrows`. The port's `instanceof HColorSimple` guard (T5d) is not in the
   Java. Replace it with the type the klimt substrate carries
   (`HColorOrPaint`, `ColorMapper.ts:109`) and route the colour the way the
   other engines' style-driven strokes do (`Style.applyStrokeAndLineColor` in
   `src/core/style/Style.ts` if ported; else the gantt `paintOf` helper,
   `draw/header/TimeHeader.ts`). State the mechanism (what type arrived and
   why) in the hand-back.
3. Compare the rendered SVG with the jar oracle `test-results/dot-cache/gantt/mexito-28-toli086/in.svg`
   through `compareSvg` (as `tests/oracle/svg-conformance/render-fixture-gantt.ts`
   does) and report verdict + firstDiff — the arrow stroke colour must be the
   jar's.

## Write-set
`src/diagrams/gantt/GanttConstraint.ts`, `src/diagrams/gantt/GanttArrow.ts`
(only if the colour type reaches it), their tests. Nothing under `src/core/`.

## Acceptance
Typecheck/eslint/prettier clean; `tests/unit/gantt` green; the mexito source no
longer throws; the `-[#012]->`, `-[dotted]->` and plain-style arrows render
with the jar's stroke attributes (cite the oracle values in the test).

Observability: N/A. Rollback: Reversible.
