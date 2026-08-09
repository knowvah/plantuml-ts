## Observation: usecase-footprint.ts / footprintBoxes could NOT be retired —
## sole consumer is the off-limits leaf-sizing.ts

- **Context**: T2 (sizer-footprint-parity) — ADR-2 instructs routing the
  usecase sizer through the real `TextBlockInEllipse`/`Footprint` classes
  and retiring `src/diagrams/description/usecase-footprint.ts` (152 lines)
  and `leaf-sizing-text.ts#footprintBoxes`.
- **Finding**: `footprintBoxes` (`leaf-sizing-text.ts:311`, in write-set) and
  `boxPoints`/`containingEllipse` (`usecase-footprint.ts:71,145`, the file
  the task requires deleted) have exactly ONE consumer each in the entire
  codebase: `measureUsecase` in `src/diagrams/description/leaf-sizing.ts`
  (imports at `leaf-sizing.ts:44,46`; call sites at `:306-308`).
  `leaf-sizing.ts` is this task's explicit OFF-LIMITS file ("Never touch
  leaf-sizing.ts" — Boundaries section) because it still holds T3's two
  `hasUnroutedUsecaseMarkup` guards. Deleting `usecase-footprint.ts` (as
  instructed) breaks `leaf-sizing.ts:46`'s import regardless of how
  `footprintBoxes`'s internals are reimplemented — there is no way to
  retire the file without an edit to the sole importer, and that importer
  is off-limits. This is the literal STOP condition #1 in the task file
  ("A file outside the write-set needs changing").
- **What WAS confirmed safe and completed instead**:
  1. `AtomImageResolver`'s optional `inkX/inkY/inkWidth/inkHeight` return
     fields (`creole-atoms.ts:130-142`, the *previous* mission's own ADR-2
     seam) have ZERO consumers anywhere — verified by grepping every
     `inkX|inkY|inkWidth|inkHeight` occurrence in `src/` and confirming the
     only place a resolver's return value is destructured
     (`EntityImageDescriptionDelegates.ts#dimensionOf`, `render-atoms.ts`'s
     `ResolvedAtomImage` type) never reads them. Deleted cleanly — this part
     of ADR-2 IS closed.
  2. `SpriteDims.inkX/inkY/inkWidth/inkHeight` (`creole-atoms.ts:159-167`,
     a DIFFERENT interface, populated by `sprite-commands.ts
     #spriteDimsLookupFor`) is NOT the same channel and was left untouched:
     `leaf-sizing.ts:368-370` (`sizingAtomImageResolverFor`'s `fitToInk`
     branch, off-limits, still load-bearing for the REAL
     `EntityImageDescription.calculateDimensionSlow` faithful path) still
     reads `.inkWidth`/`.inkHeight` from it. `sprite-commands.ts` needed NO
     edit as a result.
  3. T1's `_unusedLegacyDefaultFont` wart on `StripeSimple.ts#buildLineAtoms`
     WAS removed — its sole 3-arg caller (`leaf-sizing-text.ts:83-87`, in
     THIS task's write-set, unlike T1's) now passes 2 args.
     `#lizard forgives` comments added to the 4 pre-existing 6-param-shaped
     functions the edit's hook re-flagged (confirmed pre-existing via T1's
     own note, not introduced by this edit).
- **Impact**: `measureUsecase`'s guarded fallback (latex/`<img>`/multi-line
  `<$sprite>` displays) still computes its ellipse via the OLD analytic
  `footprintBoxes`/`containingEllipse` substitute, not the real `Footprint`
  class. The multi-line-sprite mis-stacking this mission's brief predicted
  would "dissolve" was NOT exercised — it can't dissolve while the
  substitute survives. T3 (which already owns `leaf-sizing.ts` and removes
  the two guards) is the natural owner of the real fix: once
  `hasUnroutedUsecaseMarkup` is gone and every usecase routes through
  `measureEntityLeaf`/`EntityImageDescription.calculateDimensionSlow` (the
  ALREADY-faithful path, confirmed in `leaf-sizing.ts`'s own module doc),
  `measureUsecase`/`footprintBoxes`/`usecase-footprint.ts` become
  genuinely dead and can be deleted in that same task's write-set.
- **Confidence**: High — verified by direct grep across `src/` (single
  call site each) and by reading `leaf-sizing.ts:44-46,129-135,255-325`
  directly.
