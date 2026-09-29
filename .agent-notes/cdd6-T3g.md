## Observation: class-classifier hyperlink colour never passes through usymbol-resolve#textFont
- **Context**: cdd6 T3g, rows jixipo-21-mefu703 / zivenu-37-nace681 (the
  three `a/text/@fill` diffs left after the title link closed).
- **Finding**: `textFont` (usymbol-resolve.ts) only builds fonts for
  USymbol entities (description leaves, class-diagram usecase/actor/etc.).
  A `class X { + [[url]] }` member row starts from
  `class-member-creole.ts#memberBaseFont`, which returns a fresh
  `{family,size,color:null,styles,fontFace}` and drops any extra field;
  its `fontSpec` comes from `class-layout-generic-classifier-sections.ts`
  -> `class-member-rows.ts#buildWrappedSectionRowBuilds`. The classifier
  NAME link goes through `class-layout-header-geo.ts` ->
  `class-layout-header-creole.ts#buildHeaderLineMetrics` (same
  `memberBaseFont`). `CommandCreoleUrl.ts` reads `saved.hyperlinkColor`
  from the atom's ambient font, so the colour must be on that base font.
  jixipo's value is `root { HyperlinkColor }` and zivenu's are bare
  `.normal`/`.otro` tag selectors -- neither is an ELEMENT_BUCKET_SNAMES
  bucket (`class` is not one), so the value must come from the
  `resolveStyleCascade(styleMap, CLASS_SNAMES, 'hyperlinkcolor', [tag])`
  path (`style-cascade-class.ts` GraphCascadeOverride +
  `classTagCascadeEntry`), not from `collectElementStyleBuckets`.
- **Impact**: the follow-on write-set is style-cascade-class.ts (+ a
  theme-graph-colors-b field), class-member-creole.ts#memberBaseFont,
  class-member-rows.ts, class-layout-generic-classifier(-sections).ts,
  class-layout-header-geo.ts, class-layout-header-creole.ts.
- **Confidence**: High (call chain read; render-diff after T3g shows only
  these three fills left).

## Observation: wrapping json cells raised maxosa's diff count
- **Context**: T3g json MaximumWidth fix, D7 mover check.
- **Finding**: object/maxosa-84-juci042 went 118/148 -> 205/216 while its
  JSON text count went 20 -> 55 (jar 55) and canvas 1637 -> 1139 (jar 621).
  Its `json { FontSize 15; FontStyle italic; LineColor; LineThickness }`
  is not applied by the port, so the wrap breaks at 14px widths; every
  newly paired text now differs instead of one childCount short-circuit.
- **Impact**: another instance of compareSvg's non-monotonic count; the
  json font-style bucket and map MaximumWidth are the next movers.
- **Confidence**: High (measured before/after with render-diff).
