## Observation: aws-orange theme flattens ~150 skinparam keys; ~20 have no style row

- **Context**: mmp-T3b, porting `style/FromSkinparamToStyle.java`. The
  mission brief and orchestrator notes referenced a prior (killed) agent's
  unverified finding of "21 keys with no row" across the corpus + theme.
- **Finding**: `preprocess()` over the 7 mindmap skinparam fixtures plus
  the `!theme aws-orange` fixture (`nukose-24-funi267`) yields 186 distinct
  flat skinparam keys, NOT ~10 -- the theme's `!startsub name ... !endsub`
  blocks (participant/activity/sequence/class/object/state/etc.) are NOT
  suppressed by the sub markers when the whole theme file is included via
  `!theme`; every skinparam inside them is applied regardless of the
  rendering diagram type. Of those 186, exactly 20 produce zero `Style`
  objects from a full, faithful port of the Java table: 5 keys
  `SkinParam.java` consumes directly (`dpi`, `monochrome`, `handwritten`,
  `boxpadding`, `usebetastyle`), and 15 `sequence`/`class`/`object`/
  `state`/`participant` block-form theme keys that have no row anywhere in
  `FromSkinparamToStyle.java` itself (grep-confirmed, not a porting
  omission on this path).
- **Impact**: a future task computing "every skinparam key a theme
  yields" must run it through the real preprocessor, not estimate from
  the visible (uncommented) portion of the theme source text -- the
  `!startsub` blocks look like they might be conditional but are not.
  Any later "gap list" claim for this theme should re-derive it the same
  way (`preprocess()` + `convertSkinparam`), not copy this note's count
  forward without re-running it, since the corpus can grow.
- **Confidence**: High (measured via a throwaway script against the real
  preprocessor + the full ported table, cross-checked with `grep -i` over
  the upstream Java for each of the 20 gap keys).
