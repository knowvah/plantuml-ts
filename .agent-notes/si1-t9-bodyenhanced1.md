# SI1/T9 — BodyEnhanced1 + BodyFactory assembly

## Observation: upstream-shaped (ISkinParam, Style) params narrow at runtime, not in the signature
- **Context**: Filling `BodyFactory.create1/create2` and the
  `BodierLikeClassOrObject#newMethodsOrFieldsArea` bridge; `Bodier#getBody`'s
  signature (T5/T7, out of write-set) fixes the param types to the abel stubs.
- **Finding**: The resolved ADR-9 seam values ride ON the objects passed
  through the upstream-shaped params: `BodyEnhanced1Style extends Style,
  BodyEnhanced1StyleValues { atomOps; nestedDiagramRenderer? }` plus
  `requireBodyEnhanced1Style`/`requireBodyEnhanced1SkinParam` guards
  (`BodyEnhanced1Config.ts`) that throw the ADR-2 "deferred per SI1/ADR-2:
  … supply X" idiom on a bare stub. This preserves upstream call shapes at
  every site (BodierSimple untouched) while keeping this port cascade-free.
- **Impact**: Any future `create1`/`create2` caller (T12 folder un-narrowing,
  engine migrations) must supply a style object carrying the resolved values
  — `tests/unit/core/cucadiagram/helpers.ts#makeBodyStyle` is the reference
  constructor. Same for skinParam (`helpers.ts#fakeSkin`).
- **Confidence**: High (typecheck+tests).

## Observation: BodyEnhanced1's WithPorts contract forced TextBlockMarged/TextBlockVertical closure pulls
- **Context**: `BodyEnhanced1#getPorts/getInnerPosition` delegate to the area;
  every decorated compartment is `TextBlockLineBefore(TextBlockMarged(MoFA))`
  and multi-compartment areas are `TextBlockVertical`.
- **Finding**: Upstream `TextBlockMarged` and `TextBlockVertical` both
  implement `WithPorts` + `getInnerPosition`; the port's copies had dropped
  them under a then-true "no caller in scope" note. Ported both (java:89-102 /
  :105-131), including upstream's UNCONDITIONAL `(WithPorts)` casts as their
  runtime-TypeError equivalents. `TextBlockMinWidth` is NOT WithPorts upstream
  (grep-verified), so a `minimumWidth`-wrapped area faithfully reports zero
  ports via BE1's fallback.
- **Impact**: Port geometry through decorated bodies is now end-to-end
  (translateY(top) then vertical offsets — pinned in BodyEnhanced1.test.ts).
  These two files were outside T9's declared write-set: a measured two-level
  closure pull (~60 lines), reported to the orchestrator.
- **Confidence**: High (through-stack tests pin positions 4 and 22).

## Observation: getTitle now has TWO scope-forced private copies
- **Context**: Upstream hosts `getTitle` on `BodyEnhancedAbstract`; the port's
  abstract (T2a) has no titleConfig/skinParam/atomOps fields.
- **Finding**: `BodyEnhanced2.ts#getTitle` (T2b) and `BodyEnhanced1.ts#getTitle`
  (T9) are duplicate private copies; consolidating onto the abstract requires
  changing BOTH subclasses' `super()` calls in one batch. BE2's doc flagged T9
  to consolidate, but BE2 was outside T9's write-set.
- **Impact**: A batch owning all three body files should consolidate (also the
  `area` memoization field and the T7-noted abel/ISkinParam widening —
  `MethodsOrFieldsAreaSkinParam` is still a derived interface, now consumed by
  BodyFactory's public surface).
- **Confidence**: High.

## Observation: tree/table iterator pushback maps to peek-then-advance
- **Context**: `buildTreeOrTable`'s `it.previous()` on the shared
  `ListIterator` (java:199-218).
- **Finding**: With the index-cursor adaptation (MethodsOrFieldsArea's
  precedent), the faithful equivalent is peek-without-consuming: only advance
  `cursor.i` when the line IS tree/table. Java's `\s` in the `^(\s+)` indent
  pattern is ASCII-only — written as `[ \t\n\x0B\f\r]` explicitly, since JS
  `\s` also matches Unicode spaces (behavioral difference on NBSP-indented
  lines).
- **Confidence**: High (loop-exhaustion + purge-miss branches unit-tested).
