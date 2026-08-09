# T5 — widen routing (bodyenhanced-atom-seams, batch 5)

## Observation: box+`<img>` was NOT actually closed by T3/ADR-3 — the fix
  landed on a text-block builder `buildDesc` no longer calls
- **Context**: task file/decisions.md credited T3/ADR-3's `imgFallbackFont`
  threading with closing the box+`<img>` narrowing (`hasUnroutedBoxMarkup`).
  First attempt removed `<img` from the guard; ratchet run showed 0 widened
  because I had (initially, by mistake) never actually applied the edit —
  re-applying it for real produced `jecici-56-bimu826` WIDENED
  0 -> 0.398264in.
- **Finding**: `imgFallbackFont` (T3/ADR-3) threads through
  `EntityImageDescriptionSupport.ts#buildTextBlock` -> `buildWrappedLines`
  -> `buildLine` -> `buildLineAtoms`. But `buildDesc`
  (`EntityImageDescriptionDelegates.ts:206-243`, T4/ADR-1) builds the MAIN
  `desc` content via `BodyFactory.create3`'s real `Sea`/`SheetBlock1`
  pipeline, NOT `buildTextBlock` — `buildTextBlock` is reachable ONLY from
  `buildStereo` (stereotype text, `Delegates.ts:254`) since T4 landed.
  `create3`'s own atom ops (`descAtomOps#dimensionOf`,
  `Delegates.ts:127-133`) measure the "(Cannot decode)" fallback text at the
  per-atom cascaded font with NO diagram-default substitution — the
  original S1L-h bug, unfixed on this (now the ONLY live) path.
- **Impact**: `hasUnroutedBoxMarkup` keeps `<img` guarded (reverted). Any
  future task closing this for real needs an `imgFallbackFont`-equivalent
  seam threaded through `descAtomOps`/`CreoleParser`
  (`EntityImageDescriptionDelegates.ts`, off-limits to this task).
- **Confidence**: High — reproduced via a real ratchet run (jecici-56
  widened), traced via `buildDesc`'s own doc comment ("now build a real
  Display/ISkinSimple/AtomOps and call the real BodyFactory.create3 instead
  of the buildTextBlock scoped substitute") plus direct code reading.

## Observation: usecase+`<$sprite>` ink-fit only closes for a SINGLE-LINE
  display — a multi-line display mixing a sprite with any other line
  regresses via the SAME `Sea`/`SheetBlock1` pipeline
- **Context**: applying ADR-2's ink fields unconditionally to
  `sizingAtomImageResolverFor` and removing the `<$` check from
  `hasUnroutedUsecaseMarkup` widened `bootstrap-0`/`ruziru-69-xixo434`
  (0 -> 0.029321in) — both fixtures have exactly one node ('a') whose
  display is TWO lines (a sprite line, then a text line); their other 5
  nodes (single-line, pure sprite) were unaffected (0 delta).
- **Finding**: `SheetBlock1.ts` (`y += sea.getHeight()`, `heights.set(...)`)
  stacks physical lines using `Sea#getHeight()`, which folds every atom's
  `calculateDimension` result (i.e., the SAME resolver return `leaf-sizing
  .ts#sizingAtomImageResolverFor` supplies). Upstream stacks lines on the
  DECLARED box; this resolver must return the INK box for the ellipse fit
  (ADR-2) — so shrinking to ink also shrinks the CURSOR ADVANCE to the next
  line, under-stacking a multi-line block by declared-minus-ink height. A
  single-line display has no next line, so this never bites it (a lone
  rectangle's enclosing-circle dimensions are translation invariant).
- **Impact**: `hasUnroutedUsecaseMarkup` now guards `<$sprite>` ONLY when
  the display is multi-line (`display.includes('\n')`); single-line sprite
  usecases route through `measureEntityLeaf`. `sizingAtomImageResolverFor`
  gained a `fitToInk` parameter, true ONLY for `usecase`/`usecase-business`
  — applying the ink-shrink unconditionally to ALL symbols widened two
  `card` fixtures (`sprite-SVG-fill-management-3`, `tatori-66-kaci883`)
  whose sizing depends on the DECLARED atom width for line-advance, not a
  Footprint ellipse fit.
- **Impact for T6/SI1**: fully closing the mixed-line residual needs a
  declared-vs-ink split threaded through `SheetBlock1.ts`'s line-stacking
  (out of this task's write-set) — same class of fix box+`<img>` needs in
  `descAtomOps`, both pointing at the SAME architectural gap: the real
  create3/Sea/SheetBlock1 pipeline has no "diagram-default"/"declared box"
  side-channel anywhere, only ONE resolved value per atom used for every
  purpose (line width, line-stacking height, AND footprint fitting).
- **Confidence**: High — reproduced via a real ratchet run before/after,
  root-caused by reading `Sea.ts`/`SheetBlock1.ts` directly, re-verified
  (0 widened after the multi-line guard + usecase-only `fitToInk` gate).

## Observation: conformance count could not rise for this batch — the
  fixtures ADR-6/T5 targeted were ALREADY conformant via the pre-T5 guarded
  path, from unrelated earlier work (S1L-k, description-leaf-sizing-audit)
- **Context**: acceptance criteria expected "a modest rise (~3 fixtures)"
  from closing usecase+sprite and box+img.
- **Finding**: `bootstrap-0`, `ruziru-69-xixo434`, `jecici-56-bimu826` were
  all ALREADY `None` (conformant) in `size-backlog.json` before this task
  touched anything (verified via `git stash` A/B baseline run). The
  `size-backlog.json` doc string's own history shows S1L-k (an EARLIER,
  already-merged mission) closed all three via the OLD guarded path.
  Routing usecase+single-line-sprite through the new path reproduces the
  SAME numbers (both paths are byte-exact for a lone atom); box+img stayed
  on the old path entirely (guard restored). A full A/B diff of all 351
  fixtures' `(conformant, delta, status)` tuples before vs after this
  task's real net change shows ZERO fixtures changed status.
- **Impact**: 320/351 in, 320/351 out — flat, not risen, despite a real,
  correct, diagnosed routing improvement (one guard genuinely closed). The
  "modest rise" expectation in the task file predates this state and is
  stale for the same reason the "three guards" framing was. No pin needed
  deletion as a result (nothing flipped).
- **Confidence**: High — verified via `git stash`/re-run A/B diff, not
  assumed.
