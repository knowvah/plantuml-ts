## Observation: inline shadow filters are not lifted into <defs>
- **Context**: porting the sequence grouping-frame drop shadow (unwind2-S9).
- **Finding**: `svg-defs.ts#extractFilterDefs` lifts only `b<hash>` (feFlood
  back-colour) filters out of a fragment body; a shadow `<filter>` emitted
  inline stays in the body. A shadow def must travel in the fragment's
  `extraDefs` (class, state and now sequence do this).
- **Impact**: an engine that emits its shadow filter inline gets a stray
  `<filter>` in the content group and an empty `<defs/>`.
- **Confidence**: High

## Observation: sequence participants under shadowing are unported
- **Context**: jar renders under `skinparam shadowing true` / `skin rose` /
  `!theme materia` (tests/fixtures/unwind2-S9/).
- **Finding**: the jar shadows every plain participant head and foot box and
  grows the head row by the delta (frames start 3px lower at Shadowing 3);
  this port draws neither. Only the glyph kinds routed through
  `renderer-participant-symbol.ts` read `resolveElementShadowing`.
- **Impact**: any shadowed sequence diagram diverges in participant ink and
  every y below the head row.
- **Confidence**: High
