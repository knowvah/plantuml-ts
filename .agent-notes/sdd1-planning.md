## Observation: sequence engine bypasses the ported style engine entirely
- **Context**: planning sequence-divergence-drive (sdd1), 2026-10-19, main 9e3a27dee.
- **Finding**: `src/diagrams/sequence/` imports nothing from `src/core/style/`.
  Every style value is a constant or `theme.colors`/`theme.sequence`. The jar's
  `element { LineThickness 0.5 }` and `participant { RoundCorner 5 }`
  (plantuml.skin:91-93,193-195) therefore never appear: lifeline stroke-width
  missing in 1122 of 1143 fixtures, participant rx/ry + stroke-width in ~1090.
  Mindmap/wbs/salt (all ~100% conformant) use `mindmap-style-builder.ts`.
- **Impact**: the single largest sequence divergence is architectural, not
  numeric. Removing paint/font diffs alone leaves 338 fixtures at zero diffs.
- **Confidence**: High (measured via the ratchet path, plans/sequence-divergence-drive/measurements/plan-classify.json).

## Observation: one partial style hook already exists for sequence shadowing
- **Context**: same planning pass.
- **Finding**: `src/core/sequence-shadowing.ts` resolves `Shadowing` through the
  real style engine, but ONCE per document via `build-theme.ts:84-86` into
  `theme.colors.graph.sequenceShadowing`; its head comment states per-event
  capture is "Not modelled". Read by renderer-divider, ref-body-geo,
  sequence-layout-participants, sequence-shadow, sequence-layout-note-shadow.
- **Impact**: any sequence style port must retire this path too (sdd1 T3b/T3c),
  or shadowing keeps a second, document-wide resolution.
- **Confidence**: High.

## Observation: classify on the ratchet path needs the fixture include store
- **Context**: re-rendering the corpus with `renderFixtureSequence`.
- **Finding**: without `options.includeStore: fixtureIncludeStore()`,
  `nereka-67-deco609` and `tuzaga-87-gene496` throw `StdlibNotBundledError`;
  the committed diff-baseline measured them with the store. Also
  `sequence.golden.ratchet.test.ts:77` renders without the store, so a pinned
  `!include` fixture would fail the ratchet.
- **Impact**: every sequence measurement tool and the golden ratchet must pass
  the store (sdd1 T0a/T0b).
- **Confidence**: High.
