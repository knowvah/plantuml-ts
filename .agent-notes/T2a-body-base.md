# T2a — BodyEnhancedAbstract + TextBlockLineBefore port + class-side rewire

## Observation: `TextBlockUtils.withMargin`'s 2-arg call convention is NOT
Java's 2-arg overload — a landmine for any faithful port

- **Context**: Porting `BodyEnhancedAbstract#decorate`'s three `withMargin`
  call sites faithfully from the Java.
- **Finding**: Java has a real 2-arg `withMargin(tb, marginX, marginY)`
  overload where `marginX` maps to LEFT+RIGHT and `marginY` to TOP+BOTTOM.
  This port's consolidated `TextBlockUtils.withMargin(tb, marginX1,
  marginX2 = marginX1, marginY1 = marginX1, marginY2 = marginX2)` does
  **not** reproduce that semantics if called positionally with exactly 2
  explicit args — `withMargin(tb, 6, 0)` would silently produce
  `{left:6, right:0, top:6, bottom:0}` instead of Java's
  `{left:6, right:6, top:0, bottom:0}`. The fix is to always call the
  4-arg form explicitly (`withMargin(tb, X, X, Y, Y)`) when translating a
  Java 2-arg call site.
- **Impact**: This is already a documented, established convention
  elsewhere in the codebase (`USymbolUsecase.ts:97-110`,
  `state-sizing.ts:152-165`'s `BODY_MARGIN_X`) — I independently rediscovered
  it while porting `decorate()`'s `withMargin(block, marginX, 0)` /
  `withMargin(block, marginX, 4)` call sites, and used the explicit 4-arg
  form in `BodyEnhancedAbstract.ts`. Any future port touching a Java 2-arg
  `withMargin` call must do the same — grep for `TextBlockUtils.withMargin`
  call sites with exactly 2 numeric args as a smell.
- **Confidence**: High (verified against `TextBlockUtils.java:64-78` and
  this port's `TextBlockUtils.ts:90-99` directly, plus 3 independent
  precedent doc comments already in the codebase).

## Observation: `decorate()`'s `getMarginX()` (6, class/object diagrams)
already cross-checks against `sectionWidth`'s `NAME_MARGIN_TOTAL*2`

- **Context**: Cross-checking the class-side jar-verified
  `class-body-enhanced-layout.ts` width computation against a fresh Java
  port of `decorate`.
- **Finding**: `BodyEnhanced1#getMarginX()` = 6
  (`~/git/plantuml/.../cucadiagram/BodyEnhanced1.java:113-115`). The
  class-side `sectionWidth()` (`class-member-rows.ts`) already adds
  `NAME_MARGIN_TOTAL * 2` (= 12) to the member-area width — a DIFFERENT
  Java constant (`MethodsOrFieldsArea`'s own row margin) that happens to
  equal `decorate`'s own `2 * marginX` contribution for class/object
  diagrams. Verified `MethodsOrFieldsArea.calculateDimensionSlow`
  (`MethodsOrFieldsArea.java`) carries NO margin itself (the 6/4 margin
  only appears in a separate, never-called-from-`BodyEnhanced1` method,
  `asBlockMemberImpl`) — so there is no double-counting; `decorate()` is
  the SOLE source of the marginX contribution, and the class-side already
  bakes the correct total via a coincidentally-equal but independently
  named constant.
- **Impact**: Zero disagreement found on width. Confirms the class-side's
  jar-verified width formulas are correct as-is; the T2a rewire left width
  computation untouched (only Y-axis/height geometry was rewired onto the
  new `src/core/` owner — see `class-body-enhanced-geometry.ts`'s module
  doc comment for why: `decorate`'s X-margins never affect the computed
  height, so deriving height via a probe needs no width input at all).
- **Confidence**: High (read `MethodsOrFieldsArea.java` in full).

## Observation: `BodyEnhanced2`'s `getMarginX()` = 0 makes the titled-
separator branch's inner margin ASYMMETRIC (not simply `2*marginX`)

- **Context**: Verifying `decorate()`'s title branch
  (`withMargin(block, marginX, 6, dimTitle.getHeight()/2, 4)`) — note the
  literal `6` for the RIGHT margin, not `marginX`.
- **Finding**: For `BodyEnhanced1` (marginX=6, class/object diagrams) this
  is symmetric (6 left, 6 right) and matches this task's cross-check. For
  `BodyEnhanced2` (marginX=0 — used by some OTHER diagram family, not yet
  identified/ported), the SAME formula gives LEFT=0, RIGHT=6 — asymmetric.
  `class-body-enhanced-layout.ts` implicitly assumes marginX=6
  (BodyEnhanced1) throughout; it is correct for its own scope (class +
  object diagrams) but this asymmetry is a genuine forward-looking risk
  for whichever future task ports `BodyEnhanced2` and its consumer.
- **Impact**: Not a T2a bug (out of this task's scope — `BodyEnhanced2` is
  not built here), but worth flagging before T2b picks a subclass to port
  next.
- **Confidence**: Medium — derived from the Java source directly, but the
  diagram family that actually uses `BodyEnhanced2` was not identified in
  this task (would need a `grep -rn "new BodyEnhanced2"` in
  `~/git/plantuml` to confirm; not done here, out of scope).

## Observation: `ELEMENT_DEFAULT_LINE_THICKNESS` (0.5) traced to
`plantuml.skin:91-93`, not `root`'s 1.0

- **Context**: `BodyEnhancedAbstract#getDefaultThickness()` reads
  `style.value(PName.LineThickness).asDouble()`; this port has no
  `Style`/`PName` cascade to replicate that lookup mechanically.
- **Finding**: `plantuml.skin`'s `root { LineThickness 1.0 }` (line 15) is
  overridden by the MORE SPECIFIC `element { LineThickness 0.5 }` (lines
  91-93) for classifier bodies, per CSS-cascade specificity. The
  class-side code's pre-existing doc comment already claimed `0.5,
  PName.LineThickness's default` — this task independently verified that
  claim against the actual skin file rather than trusting the comment.
- **Impact**: Confirms zero disagreement; the value only matters for the
  `_` synthetic sentinel separator char (zero corpus reach per the
  existing doc comments).
- **Confidence**: High (read `plantuml.skin` directly).
