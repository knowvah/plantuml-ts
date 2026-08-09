## Observation: leaf-sizing-text.ts is a genuinely live, out-of-bounds
## consumer of the deleted `imgFallbackFont`/`defaultFont` threading

- **Context**: T1 (sizer-footprint-parity) — deleting the `imgFallbackFont`
  seam per ADR-1 (`AtomImg.create` hardcodes `monospace(14)`, no font should
  be threaded to the `<img>` cannot-decode fallback).
- **Finding**: Removing the 3rd param from `StripeSimple.ts#buildLineAtoms`
  entirely breaks `src/diagrams/description/leaf-sizing-text.ts:83-87`
  (`lineTextMetrics` forwards its own `defaultFont` there). That file is
  outside T1's write-set and is not literally `leaf-sizing.ts` (the one
  file the brief named as off-limits), but it sits between
  `leaf-sizing-legacy-fallback.ts` (mine) and `leaf-sizing.ts` (T3's) in the
  call chain. Confirmed it is genuinely untouchable within this task: even a
  1-line, zero-behavior-change edit to drop the dead 3rd-arg forward trips
  `check-complexity.py`'s PostToolUse hook, because the file ALREADY carries
  pre-existing 6-PARAM violations (`textBlockHeight`, `maxLineWidth`,
  `measureTextBlock`, `footprintBoxes`, `inlineFootprintBox` — verified via
  `lizard` against `git show HEAD` of the same file, so these predate T1
  entirely and are not something T1 introduced).
- **Resolution**: kept a vestigial, ALWAYS-IGNORED 3rd positional parameter
  on `buildLineAtoms` (`_unusedLegacyDefaultFont`), documented inline, so
  the one remaining external call keeps compiling but can never influence
  the fallback font (`IMG_FALLBACK_FONT` is unconditionally used). Verified
  measurement-neutral: `leaf-sizing-text.ts`'s sizer path uses a
  size-only (family-agnostic) deterministic width table
  (`baseFontConfiguration`'s own doc comment), and PlantUML's diagram
  default font size is itself 14 for every corpus fixture this ratchet
  covers — confirmed by `measure-description-size-deltas.ts` /
  `measure-class-size-deltas.ts` staying at baseline (320/351 w0, 219/708
  w0) after the change.
- **Impact**: future tasks touching `leaf-sizing-text.ts` (T3 territory)
  should expect the pre-existing complexity-hook block on ANY edit to that
  file and budget for a real refactor (param-object bundling, matching this
  project's own precedent in `EntityImageDescriptionSupport.ts`'s
  `AtomResolutionCtx`) rather than a one-line fix.
- **Confidence**: High (verified via `tsc --noEmit`, `lizard` against
  `git show HEAD`, and the hook's own block message).
