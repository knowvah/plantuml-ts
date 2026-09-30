## Observation: kexaba's "+7 residual" was a missing shift/scale field, not a draw-offset

- **Context**: T1b (mission cdd7), kexaba-26-kobu577 (`edge-label-not-creole`,
  cdd6 rows 50/63, D5). Fixing the lone-sprite `<image>` draw offset for a
  class-diagram edge label that is entirely one `<$sprite>` atom.
- **Finding (SUPERSEDES this note's original version)**: The first pass at
  this fix diagnosed a "+7 residual beyond `marginLabel`" between
  `spriteLabelAnchor`'s formula (predicting box-origin+`(1,1)`) and the
  jar's oracle SVG (drawing at box-origin+`(8,8)`), and "fixed" it by
  fitting a `SPRITE_LABEL_IMAGE_INSET = 8` constant. That diagnosis was
  WRONG: it compared `spriteLabelAnchor`'s input (`center`, which is
  `edgeResult.labelX/Y` — dot-engine's RAW, PRE-shift layout output) against
  the jar's FINAL, post-shift document-frame SVG. The two are not in the
  same coordinate frame, so the "+7" was never a real formula defect.

  The actual mechanism: `class-layout-shift.ts#shiftEdgeGeo` (and its
  helper `shiftEdgeExtras`) translate EVERY `EdgeGeo` label field
  (`label`, `labelLines`, `tailLabel`/`headLabel`, `visibilityIcon`,
  `quantifierLines`, `roleLines`, `noteBox`, `constraint`, `kalBox`,
  `sametail`, `leafContacts`) from dot-engine's raw frame into the final
  document frame by a uniform `(dx, dy)` — for kexaba, `(7, 7)`.
  `class-scale-geo-edge.ts#scaleEdgeGeoLabels` does the equivalent for the
  diagram-wide `scale` multiplier `k`. `EdgeGeo.labelImage` (added in cdd6
  T2d for the lone-sprite case) was never added to either function's field
  list, so it silently stayed in the raw dot-engine frame while every
  sibling field moved — a genuine `(dx, dy)` = `(7, 7)` gap for kexaba,
  which is exactly the "+7" previously (mis)diagnosed as a draw-offset.

  Verified twice, this session:
  1. `spriteLabelAnchor({width:17,height:12}, {x:68,y:113}, 1)` (kexaba's
     real `edgeResult.labelX/Y`, marginLabel=1) returns `(59.5,107)` — the
     RAW pre-shift anchor. Adding the missing `(7,7)` shift gives
     `(66.5,114)`, the jar's exact oracle position.
  2. A self-loop probe (`person --> person : <$pk>`, marginLabel=6,
     rendered via `scripts/oracle-render.sh`): jar's `<image>` is at
     `(122.79,25)`. This port's own dot-engine `labelX/Y` for that edge is
     `(124.29,24)` (instrumented render). `spriteLabelAnchor(..., 6)`
     returns `(115.79,18)`; `+ (7,7)` = `(122.79,25)` — exact match. A full
     `renderSync` of this fixture (now that the shift/scale fix is wired
     in) is byte-identical to the oracle's `<image>` element.
- **Fix (at the origin)**: `spriteLabelAnchor` (`class-edge-label-anchor
  .ts`) keeps the un-fitted Java-traced formula (box-origin + `marginLabel`,
  `SvekEdge.java:372-373,745-747,808-814,951-954`); `class-layout-shift.ts
  #shiftEdgeExtras` and `class-scale-geo-edge.ts#scaleEdgeGeoLabels` now
  also translate/scale `labelImage`, matching every sibling field.
- **Impact**: A single missing field in a shift/scale helper silently
  broke ONE render path (lone-sprite edge labels) while every text-based
  label field on the same edge rendered correctly — a reminder to check
  ALL post-layout transform passes (shift, scale, and any future ones)
  whenever a NEW absolute-coordinate `EdgeGeo` field is added, not just the
  attach/anchor/render trio.
- **Confidence**: High — cross-checked against two independent oracle
  renders (kexaba, marginLabel=1; a fresh self-loop probe, marginLabel=6)
  and the full `renderSync` pipeline, not fitted to either number.
