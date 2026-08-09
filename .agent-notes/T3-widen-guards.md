## Observation: the analytic substitute is NOT dead -- class diagrams have
## their own, unconditional, off-limits caller

- **Context**: T3 (sizer-footprint-parity) -- step 2 instructed deleting
  `measureUsecase`, `footprintBoxes`, `boxPoints`, `containingEllipse`, and
  `usecase-footprint.ts` once the description-diagram guards came off.
- **Finding**: `measureUsecase` (exported from `leaf-sizing.ts`) has a
  SECOND, unconditional caller that predates this whole guard mechanism:
  `src/diagrams/class/class-layout-leaf-shapes.ts:14,27`
  (`measureUsecaseOrActor`, imported for the CLASS-diagram engine's own
  usecase/actor classifier shape, 3-arg call with no sprites/stereotype).
  `src/diagrams/class/` is this task's own explicit OFF-LIMITS list. This
  was already documented in `leaf-sizing.ts`'s pre-T3 module doc
  ("UNCHANGED by T6 -- kept for class-layout-leaf-shapes.ts's import") --
  T2's notes and ADR-2 itself missed re-checking it before writing "retire
  `usecase-footprint.ts`".
- **Resolution**: `measureUsecase`, `footprintBoxes`, `boxPoints`,
  `containingEllipse`, `inlineFootprintBox`, and `usecase-footprint.ts`
  ALL survive this task -- verified dead by reading every caller (not
  grepping alone): `class-layout-leaf-shapes.ts:27-28` calls `measureUsecase`
  unconditionally; `footprintBoxes`/`inlineFootprintBox`
  (`leaf-sizing-text.ts`) and `boxPoints`/`containingEllipse`
  (`usecase-footprint.ts`) are `measureUsecase`'s own implementation, so
  they inherit its live-ness. No file outside the write-set was touched or
  needed to be -- this is a "cannot delete" finding, not a "must edit
  off-limits file" one.
- **Impact**: `usecase-footprint.ts` (152 lines) remains in the codebase.
  Retiring it for real needs `class-layout-leaf-shapes.ts` to route through
  an equivalent of `measureEntityLeaf` for class-diagram usecase/actor
  shapes too -- out of `src/diagrams/class/`'s off-limits boundary,
  candidate follow-up task.
- **Confidence**: High -- read both call sites directly
  (`class-layout-leaf-shapes.ts:21-31`, `leaf-sizing.ts:129-142`).

## Observation: multi-line usecase+sprite routing is a genuine STOP
## condition -- ADR-2's "dissolves" premise is false for this port

- **Context**: T3 step 1, widening `hasUnroutedUsecaseMarkup` fully
  (dropping `<img` AND the multi-line-`<$sprite>` sub-case, per ADR-2's
  claim that Footprint-based routing makes the multi-line mismatch
  "dissolve instead of needing its own fix").
- **Finding**: dropping the multi-line guard widened `bootstrap-0` and
  `ruziru-69-xixo434` by exactly 0.029321in -- the SAME number the mission
  brief's own acceptance table lists as the pre-fix baseline, meaning
  nothing about T1/T2/T3's other work touches this mechanism at all.
- **Mechanism (traced by reading)**: `sizingAtomImageResolverFor`'s
  `fitToInk` branch (`leaf-sizing.ts`, ~line 366) returns a usecase
  sprite's INK box (`SpriteDims.inkWidth/inkHeight`) as its WHOLE resolved
  dimension. That resolver is passed into `descAtomOps`
  (`EntityImageDescriptionDelegates.ts:127-133`, `dimensionOf` calls
  `resolveAtomImage`), which is `SheetBlock1.ts`'s ONLY dimension source
  for a sprite atom. `SheetBlock1.ts:180-182`
  (`const height = sea.getHeight(); ... y += height;`) uses that SAME
  ink-shrunk number to stack the NEXT line's y-position, and
  `USymbolUsecase.ts:160-162` (`TextBlockInEllipse(desc,
  stringBounder).calculateDimension`) later draws `desc` (the merged
  stereo+label `SheetBlock1`) through a `Footprint`-backed `UGraphic`,
  observing that same under-stacked y. Upstream keeps these two uses
  separate -- `AtomSprite.calculateDimension` always returns the DECLARED
  box; ink narrowing is exclusively a `Footprint#drawPath` point-collection
  artifact at DRAW time. This port's `fitToInk` shortcut (a sizer-side
  approximation, since the sizer never actually draws an SVG path through a
  point-collecting graphic the way the renderer's `Footprint`/
  `svg-path-bbox.ts` do) collapses the two into one number, so a
  MULTI-LINE display's second line stacks (declared-minus-ink) too high.
- **Ruled out**: NOT a `<latex>`-guard issue (unaffected, stays gated
  either way); NOT a box-family issue (jecici-56-bimu826 and the box+`<img>`
  family stayed conformant when THAT guard alone was dropped, confirmed by
  a full 351-fixture run); NOT the usecase+`<img>`-only case (no corpus
  fixture exercises it; the full-corpus run showed zero regressions once
  the guard was narrowed back to `<latex>` + multi-line-`<$sprite>` only).
- **Resolution**: kept the multi-line-`<$sprite>` sub-case guarded (reverted
  that one piece of the widening); single-line sprite and `<img>` (usecase)
  and `<img>` (box family) all route unguarded now. Diagnosis written inline
  at `leaf-sizing.ts#hasUnroutedUsecaseMarkup`'s doc comment (file:line
  citations there). A real fix needs `SheetBlock1.ts` to carry a per-atom
  LAYOUT height distinct from its `Footprint`-observed ink height -- exactly
  the `Sea`/`SheetBlock1` side channel ADR-3 forbids, in a file off-limits
  to this task regardless. Not re-solved here, per the mission's own
  explicit STOP-and-report instruction (ADR-4).
- **Impact**: ADR-2's premise needs correction for any follow-up mission:
  "the sizer already draws through Footprint" is true for LAYOUT (position),
  but the ink-narrowing SHORTCUT this port took for the ellipse fit
  (`fitToInk`, a sizer-only approximation with no upstream analogue) is NOT
  observationally equivalent to upstream's real draw-time ink recording, and
  leaks into unrelated layout math whenever a resolved dimension is reused
  for both purposes.
- **Confidence**: High -- verified via `git stash`-isolated before/after
  measurement (0.029321in delta reproduced exactly) and direct reading of
  `SheetBlock1.ts:170-184`, `EntityImageDescriptionDelegates.ts:127-133`,
  `USymbolUsecase.ts:147-174`.

## Observation: 3 pre-existing stale `size-backlog.json` pins, unrelated to
## this task's changes

- **Context**: T3 step 4, deleting any pin whose fixture flips.
- **Finding**: `codabo-50-mupa164`, `fepuvo-06-rugi981`, `nenedo-78-fiva569`
  were ALREADY at delta 0 (conformant) at this task's starting commit
  (`ffe89516`, verified via `git stash` + a clean measurement run BEFORE any
  T3 edit) -- their entries were simply never deleted when their underlying
  fixes landed in earlier missions (S1L-a's creole-titled-separator fix for
  codabo-50, S1L-e batch 1's link-endpoint-newline fix for fepuvo-06, S1L-f
  part 2a's per-atom-font/guillemet fixes for nenedo-78 -- all named in this
  file's own `_doc` narrative). None of the three is a target fixture for
  this mission.
- **Resolution**: deleted all three (34 -> 31 entries), since the write-set
  explicitly permits "deletions only" and a stale pin misrepresents the
  ratchet's real conformance. Documented the attribution in `_doc` so a
  future reader does not mistake this for a T3 result.
- **Impact**: none on the mission's target fixtures; pure housekeeping,
  caught as a side effect of running the full measurement script for the
  real target fixtures.
- **Confidence**: High -- reproduced via `git stash`/`git stash pop`
  isolating T3's own diff from the baseline.

## Observation: `hasUnroutedBoxMarkup` is now dead code in a file outside
## this task's write-set

- **Context**: T3 step 1, narrowing the box-family guard from `<latex>` OR
  `<img>` down to `<latex>` only.
- **Finding**: `hasUnroutedBoxMarkup` (`leaf-sizing-legacy-fallback.ts:67`,
  NOT in this task's write-set -- only `measureLegacyBoxFallback` and the
  call site in `leaf-sizing.ts` needed to change) checked BOTH conditions.
  Rather than edit that function's body (touching an out-of-write-set
  file), the call site in `leaf-sizing.ts` was changed to inline
  `node.display.includes('<latex>')` directly and stop importing/calling
  `hasUnroutedBoxMarkup` at all. That function now has zero callers
  anywhere in `src/`/`tests/` (grep-confirmed).
- **Resolution**: left `hasUnroutedBoxMarkup` in place, unedited, per
  pr-workflow.md's "log violations in other files, don't touch them"
  guidance -- this file is not in T3's write-set.
- **Impact**: a follow-up task touching `leaf-sizing-legacy-fallback.ts`
  should delete `hasUnroutedBoxMarkup` (and re-verify `measureLegacyBoxFallback`
  has no other dead paths now that `<img>` never reaches it).
- **Confidence**: High -- grep across `src/` and `tests/` shows zero
  remaining references beyond the function's own definition.
