## Observation: class usymbol leaf draw re-measures independently of the sizer
- **Context**: cdd7 T1c, xuloxo-85 wrapWidth gap.
- **Finding**: `renderer-usymbol-entity.ts` builds its own `EntityImageDescription`
  and draws the rect at that object's own dimension, not the layout's. Any opt
  the sizer (`class-layout-generic-classifier.ts#buildDescriptionLeafOpts`) passes
  but the draw params omit shows up as a rect/text mismatch (wrapWidth did).
- **Impact**: when adding a style input to the class USymbol leaf, set it on BOTH
  sides; diff the sizer opts against `buildUSymbolEntityParams` first.
- **Confidence**: High

## Observation: Theme carries neither defaultTextAlignment nor RoundCorner<<label>>
- **Context**: same task, xuloxo leaf alignment + rx residuals.
- **Finding**: `skinparam defaultTextAlignment` (FromSkinparamToStyle.java:155,
  root HorizontalAlignment) has no accumulator/Theme field; the ported
  `src/core/style/FromSkinparamToStyle.ts:185` table is not reachable from the
  class renderer. `skinparam <sname>RoundCorner<<label>>` (addMagic, :275) is not
  in `skinparam-stereo-keys.ts` GROUP_BY_STEREO_RE and `ElementColors` has no
  `roundCornerByStereo`. Scratch probe: CENTER + roundCorner 0 removes every
  xuloxo leaf x/rx diff.
- **Impact**: C4 stdlib diagrams (all set both) cannot reach leaf parity until
  those core fields land.
- **Confidence**: High
