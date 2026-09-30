## Observation: xuloxo's edge label needs creole shorthand AND word-wrap; only the former is in T1b's scope

- **Context**: T1b (mission cdd7), xuloxo-85-vibu502 (`class-head-arrow-
  triangle`, cdd6 row 67, edge-label half). Fixing the C4 `Rel(...)`
  relationship label's creole formatting.
- **Finding**: The C4 stdlib's `Rel(personAlias, containerAlias, "Label",
  "Optional Technology")` macro renders as a two-line edge label:
  `**Label**` (bold name) and `//[Optional Technology]//` (italic,
  bracketed technology). `**`/`//` are valid creole shorthand even in
  `CreoleMode.SIMPLE_LINE` (`CommandCreoleBuilder`'s constructor adds
  BOLD/ITALIC's creole form unconditionally, `FontStyle.java:207-224`'s
  `getUbrexCreoleSyntax`), but this port's shared `stripCreoleMarkup`
  (`core/edge-label-box.ts`) only recognizes XML-style tags (`<b>`,
  `<i>`, ...), so the literal `**`/`//` markers were being measured and
  drawn as text. Fixed via a class-edge-label-local
  `stripCreoleShorthand` (`class-edge-label-measure.ts`), used by both the
  box-reservation measure (`computeMeasuredLabelAttrs`'s multi-line arm)
  and the render anchor (`class-edge-label-anchor.ts#multiLineLabelAnchor`).

  SEPARATELY, the jar wraps the technology line further:
  `//[Optional Technology]//` becomes two PHYSICAL lines, `[Optional` and
  `Technology]` (oracle SVG: three `<text>` elements for what is ONE
  logical `\n`-split line — `[Optional`, a bare space, `Technology]`).
  This is upstream's per-line word-wrap (`Display#create8`'s
  `Fission#getSplitted`/`LineBreakStrategy`, mirrored in this port by
  `class-edge-label-lines.ts#wrapPlainTextLine`, which exists but is
  currently wired ONLY into classifier-header wrapping
  (`class-layout-header-creole.ts`), never into the edge-label multi-line
  path). Implementing word-wrap for the edge-label anchor would need: (1)
  the DOT box reservation to also wrap (in `class-layout-edge-labels.ts`,
  OUTSIDE this task's write-set), and (2) `multiLineLabelAnchor` to emit
  MULTIPLE physical lines per logical line. Out of scope for T1b (write-set:
  `renderer-edge-label.ts`, `class-edge-label-anchor.ts`,
  `class-edge-label-measure.ts` only) — left as a residual, matching D10's
  own expectation ("xuloxo is the likely miss: a C4 diagram with several
  residual channels").
- **Impact**: xuloxo's edge-label bold/italic atoms now match the oracle's
  formatting (weight/style), but the technology line's word-wrap and the
  resulting per-line `x`/`y`/`textLength` values remain diverged until a
  follow-on wires `wrapPlainTextLine` (or an equivalent) into the edge-label
  multi-line path AND its DOT box reservation.
- **Confidence**: High (creole shorthand mechanism, cross-checked against
  the jar's oracle SVG and `FontStyle.java`); the word-wrap follow-on's
  scope (both files it needs) is a direct reading of the existing
  `wrapPlainTextLine` doc comment, not independently verified end-to-end.
