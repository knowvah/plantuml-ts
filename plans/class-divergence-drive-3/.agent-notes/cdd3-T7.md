# cdd3-T7: vertical 1px (R-VP)

## Observation: bodyInkHeight is the Y analogue of bodyInkWidth, gated on
## both compartments suppressed
- **Context**: jubobo/bejeli/gabejo/julixi/rulite/xosiza were each 1px too
  TALL; all six have `hide members` or an equivalent that suppresses BOTH
  the fields and methods compartments on the bottom classifier.
- **Finding**: `BodierLikeClassOrObject#getBody`'s `showFields == false &&
  showMethods == false` branch returns `TextBlockUtils.empty(0, 0)`
  (`cucadiagram/BodierLikeClassOrObject.java:249-250`, confirmed by reading
  the method directly) -- draws nothing, reserves nothing. The header's own
  `TextBlockMarged` `UEmpty` blocks (`HeaderLayout.java:81-110`, already
  ported as `headerInkReservation`) are then the only body-side candidate
  for the classifier's max-Y ink point; `LimitFinder#drawRectangle`'s own
  un-widened `y + h - 1` corner (`klimt/drawing/LimitFinder.java:184-188`,
  confirmed by reading the method) competes against it exactly like the
  X-axis `bodyInkWidth` rule does.
- **Fix**: `genericClassifierInkFields` (`class-classifier-ink-
  reservation.ts`) now also returns `bodyInkHeight` (header's `maxY`),
  present ONLY when `suppress.fields && suppress.methods` -- this exactly
  matches the branch in `class-layout-generic-classifier.ts` where the box
  height is `stereoGeo.headerRowHeight` (no body at all), so
  `headerInkReservation`'s `height` param there already equals the box's
  own height. `addRectInk` (`class-ink-shapes.ts`) maxes the rect corner
  `y+h-1` against `y + (bodyInkHeight ?? height)`, mirroring the existing
  `bodyInkWidth` formula one axis over. `bodyInkHeight === undefined`
  (shown body, or any non-`LIKE_CLASS_KINDS` kind) keeps the exact
  pre-existing `y + h`, so every non-hidden-body fixture is byte-identical.
- **Scope note**: `bodyInkHeight` is set only inside
  `genericClassifierInkFields`, which is itself gated on `LIKE_CLASS_KINDS`
  -- an `object` leaf's B5/M6 three-way body-state split
  (`addRectInkEmptyShownBody`) is untouched (object's own `bodyInkWidth` is
  set by `class-object-sizing.ts`, a different function this task did not
  touch).
- **Confidence**: High -- 6/7 fixtures closed to `structural=0 numeric=0`
  (`render-diff.mts`), zero rises across the full 723-fixture corpus
  (`pin-diff.mts` against `b0.json`: 6 transitions, all
  `structural-match -> conformant`).

## Observation: lecelo's residual is untraced and unrelated to R-VP
- **Context**: per fixtures.md, lecelo-92-loma110 was `diverged | 6 | 7`
  before this task; the note predicted "7 -> 5" from an earlier probe.
- **Finding**: post-fix, lecelo measures `structural=6 numeric=5` (down
  from numeric=7, structural unchanged at 6) — matches the earlier probe.
  The remaining diffs are all a sprite/emoji glyph (`🏷` vs `label`) inside
  a `<<$sprite>>`-tagged classifier's stereotype row — a completely
  different mechanism (creole sprite-vs-text rendering), out of this
  task's R-VP scope. Left untraced, as the task file itself flags ("rest
  untraced").

## Observation: `class-geo-types.ts` needed a split to stay under the
## 500-line hook cap
- **Context**: adding `bodyInkHeight` (plus its doc comment) to
  `ClassifierGeo` pushed `class-geo-types.ts` from 503 to 508+ lines.
- **Finding**: the file already has a precedent of splitting a field's
  type out to a sibling file with a pure re-export when a change tips it
  over the cap (`NamespaceGeo`, `ClassGeometry`, `JsonBodyItem`). Extracted
  `ClassifierGeo['rows'][number]`'s ~90-line inline object type to a new
  `class-geo-row-types.ts` (`ClassifierRowGeo`, re-exported) — every
  existing consumer keys off `ClassifierGeo['rows']` /
  `ClassifierGeo['rows'][number]` (indexed-access types), so this is a
  pure move with zero call-site changes (confirmed: `npm run typecheck`
  clean with no other file touched).
- **Impact**: `class-geo-types.ts` is now 426 lines; `class-geo-builders.ts`
  needed the same one-line trim to stay at exactly 500 after adding the
  `bodyInkHeight` spread to `inkBodyFields`.
- **Confidence**: High.

## Observation: `absorbLayoutEpsilon` retirement confirmed for xosiza/
## julixi/rulite
- **Context**: R-4 (xosiza) and R-5 (julixi/rulite) had previously
  attributed these fixtures' sub-pixel residuals to
  `absorbLayoutEpsilon`/dot-engine drift.
- **Finding**: post-fix these three are `structural=0 numeric=0` —
  the ENTIRE prior residual was the 1px Y-ink term, not epsilon rounding
  or dot-engine drift. `absorbLayoutEpsilon` itself is untouched (this
  task did not edit `src/core/layout-epsilon.ts` or its call sites in
  `TextBlockExporter.ts`/`svg-graphics-core.ts`) and remains active in the
  class engine's own document-margin pipeline
  (`layout-ink-extent.ts#applyClassDocumentMargin` ->
  `TextBlockExporter.ts#applyCucaDocumentMargin`) — it still runs on every
  class render, it just no longer changes the OUTCOME for these three
  fixtures (numeric diff is now exactly 0, so there is nothing left for it
  to round away). D3 still owns the flag; not removed.
- **Confidence**: High.

## Observation: a pre-existing render-all crash is unrelated to this task
- **Context**: `render-all.mts` printed one uncaught-exception stack trace
  from `note-layout-measure-rows.ts#consumeEmbeddedRow` mid-run (around
  fixture ~640-650 of 723) but still completed and wrote all 723 rows.
- **Finding**: this task's write-set never touched `note-layout-*.ts` or
  any note-engine file; `pin-diff.mts` against `b0.json` showed exactly 6
  transitions (all improvements, zero rises), consistent with the crash
  being caught/tolerated per-row by `render-all.mts` rather than a
  regression this task introduced. Not investigated further (out of
  scope — not a file this task's mechanism touches).
- **Confidence**: Medium (not root-caused; flagged for whoever owns note
  layout next).
