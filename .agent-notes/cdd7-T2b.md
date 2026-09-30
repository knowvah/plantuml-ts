## Observation: single-classifier class diagrams skip stereotypeLabelFields
- **Context**: cdd7 T2b, dezobu-62-vuzu421 stereotype sprite.
- **Finding**: a diagram with ONE classifier is drawn from
  `class-geo-builders.ts#buildDegenerateClassifierLeaf`, which copies only
  `stereotypeLabels` -- not `visibleStereotypeLabels`/`stereotypeSprite` that
  the main path spreads via `stereotypeLabelFields`. Any USymbol-leaf feature
  added through that spread silently misses single-leaf diagrams.
- **Impact**: probe features with at least two classifiers AND one alone.
- **Confidence**: High

## Observation: Fission splits every wrapped line into word/space atoms
- **Context**: xuloxo-85 edge label under C4's `maxMessageSize 150`.
- **Finding**: with a wrap width set, `Fission#getSplitted` rebuilds each
  line from neutrons, so the jar emits `[Optional`, ` `, `Technology]` as
  three `<text>`s on ONE row even when nothing breaks (the earlier note's
  "two physical lines" was wrong). Deterministic-mode space width is 0.
- **Impact**: any wrapped label/body compares by atom, not by line.
- **Confidence**: High (jar probes, maxMessageSize 60/150)

## Observation: a root Theme scalar needs theme-merge.ts too
- **Context**: `skinparam defaultTextAlignment` plumbing.
- **Finding**: `deepMergeTheme` copies only `OPTIONAL_SCALAR_KEYS`
  (`theme-merge.ts`); a new root `Theme` field not listed there is dropped.
  Per-SName values ride `colors.elements[<sname>]` (merged wholesale), so a
  root-style skinparam fits `elements.root` without touching theme.ts.
- **Impact**: plan theme-merge.ts into the write-set for any root scalar.
- **Confidence**: High

## Observation: class single-line quoted display ignores `\n`
- **Context**: oracle probe `rectangle "wide line here\nx" as P` (allowmixing).
- **Finding**: the jar draws two lines; the class engine draws one `<text>`
  containing the literal `\n`. The TYPE1 `[ ... ]` form splits correctly.
- **Impact**: unfiled class-parser residual; avoid that form in probes.
- **Confidence**: High

## Observation: diagonal-corner leaves are UPath ink, not rect ink
- **Context**: `skinparam rectangle<<x>> { DiagonalCorner 10 }` probe.
- **Finding**: `URectangle#diagonalCorner` draws a `UPath`, which
  `LimitFinder` bounds exactly; the class leaf-ink model still reserves rect
  ink (`x-1,y-1`), so the whole document sits 1px right of the jar's.
- **Impact**: `class-layout-description-leaf-ink.ts` needs the corner.
- **Confidence**: High
