# Decision Journal — bodyenhanced-atom-seams

Appended during execution. Every non-trivial judgment call gets an entry:
if a reasonable developer might have chosen differently, log it.

## Planning — 2026-07-29

Brief generated via `/plan-mission`. Two claims were verified and one was
falsified during planning, before any task was written:

- **Scoping confirmed against the Java.** `BodyFactory.create2` →
  `BodyEnhanced1`, `create3` → `BodyEnhanced2`; `createLeaf`/`createGroup`
  return `Bodier` (the class/object MEMBER model) and are correctly SI1's,
  not this mission's.
- **S1L-i is structurally inseparable.** `decorate` and both `getArea`
  implementations carry the separator loop, so it cannot be stubbed
  cleanly. Maintainer folded it IN (ADR-4).
- **T6's "no defaultFont seam" is FALSE.** `imgFallbackFont` exists at
  `StripeSimple.ts:279` and threads end-to-end within that file; no caller
  outside ever passes it. ADR-3 corrects the premise and shrinks the
  deliverable. Eighth agent claim corrected against the code across these
  two missions — and note it is the same lock-step defect the mission line
  is about, recurring inside the fix for its own bug class.
- **Risk found at Phase 2:** only 4 `svg-description` goldens vs 352 size
  goldens, while ADR-1 is renderer-wide. Maintainer approved ADR-5 (goldens
  first) and extended its scope to existing separator-bearing fixtures.
