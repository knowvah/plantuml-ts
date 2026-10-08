## Observation: inline shadow filters are not lifted into <defs>
- **Context**: porting the sequence grouping-frame drop shadow (unwind2-S9).
- **Finding**: `svg-defs.ts#extractFilterDefs` lifts only `b<hash>` (feFlood
  back-colour) filters out of a fragment body; a shadow `<filter>` emitted
  inline stays in the body. A shadow def must travel in the fragment's
  `extraDefs` (class, state and now sequence do this).
- **Impact**: an engine that emits its shadow filter inline gets a stray
  `<filter>` in the content group and an empty `<defs/>`.
- **Confidence**: High

## Observation: compareSvg cannot see a dangling def reference
- **Context**: unwind2-S9b, re-pointing participant glyph shadows.
- **Finding**: dropping a glyph's gradient `<linearGradient>` left
  `fill="url(#g...)"` dangling, and the sequence weightedScore did not move
  (vasibu-26-lece790 scored the same with and without the def). Only a
  per-tag element-count comparison against the jar showed it.
- **Impact**: when a change touches defs, count `<linearGradient>`/`<filter>`
  and check every `url(#...)` resolves; the ratchet will not.
- **Confidence**: High
