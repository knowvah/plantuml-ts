## Observation: a theme's bare `root { BackgroundColor }` beats a more specific skin rule
- **Context**: fixing the default sequence participant fill (jar #E2E2F0,
  port #FFF). Four `!theme plain` fixtures ROSE on the ratchet once the
  default was right, because the jar draws their heads white.
- **Finding**: upstream merges styles in DECLARATION order with
  `OVERWRITE_EXISTING_VALUE` (`style/StyleStorage.java:102-114`), not by
  selector specificity. `plantuml.skin` is loaded first, so any later
  `<style> root { BackgroundColor X }` (a `!theme`'s, or the document's)
  overrides `sequenceDiagram { participant { BackgroundColor } }` even
  though the latter is more specific. Jar-verified: `!theme plain` heads
  #FFF, `!theme amiga` heads #0B58A8. `skinparam BackgroundColor` does NOT
  do this: it converts to the `document` signature
  (`FromSkinparamToStyle.java:180`), which never matches an element.
- **Impact**: 28 of 43 builtin themes declare a root BackgroundColor in
  `styleOverrides`. Any other element whose default comes from a baked
  `plantuml.skin` value (activity nodes, class boxes, notes) is subject to
  the same override under those themes; the port applies it only to
  `colors.participantBackground` today (`theme-element-resolve.ts
  #foldRootBackgroundIntoSequence`, `style-map-theme.ts
  #rootElementBackgroundRaw`). Check the jar before assuming a theme's
  root colour is canvas-only.
- **Confidence**: High (Java read; two themes oracle-verified).

## Observation: `transparent` resolves to `#00000000`, the jar writes `fill="none"`
- **Context**: 18 builtin themes declare `root { BackgroundColor transparent }`.
- **Finding**: `resolveColorToSvgHex('transparent')` returns `#00000000`;
  the jar emits `fill="none"` for the same input. Those 18 themes also give
  participants their own gradient buckets upstream (unported), so no corpus
  fixture measures the difference today.
- **Impact**: a byte-level divergence waiting for the first fixture that
  reaches a transparent fill without a bucket; fix in `HColorSet`, not per
  call site.
- **Confidence**: High (measured both sides).
