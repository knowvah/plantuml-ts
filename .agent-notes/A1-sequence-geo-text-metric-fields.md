## Observation: A1's three-scalar text-metric contract does not fit four of the
six sequence geos it names

- **Context**: `plans/sequence-text-and-y-convergence` batch 1 (A1), adding
  `textWidth`/`textAscent`/`textLineHeight` as REQUIRED fields to
  `ParticipantGeo`, `MessageGeo`'s runs, `NoteGeo`, `FrameGeo`, `DividerGeo`
  and `NewpageGeo` in `src/diagrams/sequence/ast.ts`.

- **Finding**: measured by adding the three fields verbatim and running
  `tsc --noEmit -p tsconfig.json` (48 errors). Four distinct problems, none
  visible from the type declarations alone:

  1. **`DividerGeo.textWidth` already exists, with a different meaning.**
     TS reports `Duplicate identifier 'textWidth'` at `ast.ts:548` and `:566`.
     The existing field is `AbstractTextualComponent#getTextWidth` — the text
     block PLUS the component's `topRightBottomLeft(4,4,4,4)` — and
     `renderer.ts#renderDividerLabel:242-246` uses it to size the label's
     background `<rect>`. It differs from a measured glyph width by 8.
     `DividerGeo.textHeight` is the same story on the other axis.
  2. **`NewpageGeo` carries no text at all.** Its fields are `y`, `height`,
     `bandX`, `bandWidth`. Upstream agrees: `ComponentRoseNewpage
     #drawInternalU` is three statements ending in
     `ug.draw(ULine.hline(dimensionToUse.getWidth()))` — one line, no text
     (`~/git/plantuml/.../skin/rose/ComponentRoseNewpage.java:57-62`), and
     `renderer.ts#renderNewpage` mirrors it. There is nothing for a text
     metric to describe, and batch 2's "newpage titles" (A5) has no source.
  3. **One scalar cannot describe a multi-line geo.** `NoteGeo.text` is split
     on `\n` at `renderer.ts:76` and `DividerGeo.lines` is already an array;
     `ParticipantGeo` has `display` plus N `stereotypeLines`. Each line has
     its own width, and `sequenceText` needs a per-line width to emit
     `textLength`. A per-geo scalar is only correct for the single-line case.
  4. **Required fields force edits outside A1's declared write-set.** The
     five construction sites are `sequence-layout-events.ts:331,402,443,558`
     (A4's file) and `sequence-layout-participants.ts:526` (A3's file), plus
     ~20 hand-built literals across six test files. A1's own gate is
     `git diff --name-only` listing exactly its four write-set files.

- **Impact**: the shape that actually fits is a per-RUN metric, not a per-GEO
  one — i.e. the three fields belong on `TextRun` (`text-block-geo.ts`, A2's
  file), with each geo carrying placed runs the way `MessageGeo.labelLines`
  and `FrameGeo.refBody` already do. That is a batch-2 interface change, so it
  is the maintainer's call, not a task-local one.

- **Confidence**: High — each of the four measured, not inferred: (1) and (4)
  from `tsc` output on the real edit, (2) from the upstream Java and both
  renderers, (3) from the renderer split sites.

## Observation: the sequence text emitter needs spread-conditionals for its
optional style fields

- **Context**: Same task, writing `src/diagrams/sequence/sequence-text.ts`.
- **Finding**: this project compiles with `exactOptionalPropertyTypes: true`,
  so `fontWeight: spec.fontWeight` (where `spec.fontWeight` is
  `'bold' | '700' | undefined`) is NOT assignable to `TextStyle.fontWeight`.
  Plain pass-through of an optional field to an optional field fails; the
  form that compiles is
  `...(spec.fontWeight !== undefined ? { fontWeight: spec.fontWeight } : {})`.
- **Impact**: every A2-A5 caller building a `TextStyle`-adjacent literal from
  optional inputs hits this. It is a compile error, not a silent one.
- **Confidence**: High — observed as TS2379 and fixed.
