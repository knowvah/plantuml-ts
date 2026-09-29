## Observation: class description leaves never draw their stereotype
- **Context**: cdd6 T2a, rows catana/tobevo/noxebo/fepiko/cevoti/gigoru/guxico/juzica.
- **Finding**: `renderer-usymbol-entity.ts#buildUSymbolEntityParams` passes `labels.stereotypeLabels: []`, so every `EntityImageDescription` leaf in the class engine (allowmixing `rectangle X <<s>>`, a collapsed USymbol group) drops its `«s»` line, although the layout sizes it (`class-layout-generic-classifier.ts#tryMeasureDescriptionLeaf` uses `resolveVisibleStereotypeLabels`). `ClassifierGeo` carries only the style tags (`class-geo-builders.ts:132`), not the hide/show-filtered visible labels. A scratch experiment feeding the style tags closed catana/noxebo/tobevo outright.
- **Impact**: the fix is a `ClassifierGeo` field populated in `class-geo-builders.ts` from `resolveVisibleStereotypeLabels` and read at the draw site; outside T2a's write-set.
- **Confidence**: High (experiment measured, reverted)

## Observation: skinparam stereo tiers are order-dependent upstream
- **Context**: fepiko-26 stereo colour.
- **Finding**: a stereotype text matches both `<sname>FontColor<<l>>` and `<sname>StereotypeFontColor<<l>>` (both +1000); `DarkString.java:54-57` keeps the one with the larger declaration counter. Jar probe: FontColor-then-StereotypeFontColor draws the stereo red; fepiko (StereotypeFontColor-then-FontColor) draws it blue. `ElementColors.*ByStereo` maps drop the order.
- **Impact**: no static precedence is right; fixing it needs the order carried by `skinparam-stereo-keys.ts`.
- **Confidence**: High (two jar renders)

## Observation: allowmixing `package` leaf ink is 1px off in x
- **Context**: cevoti/gigoru/guxico/juzica residual numerics (Δ1 on every x, svg width +1).
- **Finding**: `class-layout-description-leaf-ink.ts` excludes `package`/`folder` from `descriptionLeafSymbolInk` (its own doc names the `+1,+1` shift on cepedu-19), so the box ink rule applies. Jar probe `allowmixing; package EmptyPackage1` draws the folder at x=6, ours x=7 (width 241 vs 242).
- **Impact**: separate from the style family; owner = the leaf-ink module.
- **Confidence**: High (probe)
