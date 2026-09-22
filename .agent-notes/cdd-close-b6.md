# cdd-close-b6 — batch 6 close (class-divergence-drive)

Written 2026-09-22. Survey 468/92/163 → 491/104/128; census 470 → 493;
ratchet 470 → 493 (23 pins); DOT 711/712. First batch since B1 that moved
the conformant column by more than a handful: 23 fixtures reached
`conformant`, 21 more `structural-match`.

## Observation: a bucket label is not a mechanism label
- **Context**: classifying b5 → b6 movers by `fixtures.md` bucket.
- **Finding**: 5 of 44 movers sit in other buckets (B9 ×2, B1/B4 ×1,
  B5/B6/B2 ×7 share) yet moved on a B6 mechanism — T22's leaf shapes
  closed ENT5 rows, T18/T20's colour plumbing reached B1 rows. The bucket
  column records where the diagnosis FILED a fixture, not which task's
  Java method fixes it; expect cross-bucket movers at every close and
  classify by mechanism, never by bucket token.
- **Confidence**: High.

## Observation: numeric rises are the normal shadow of a structural fall
- **Finding**: 11 of the 15 rises this close had structural counts FALL
  while numeric counts rose (befasi family 10+614 → 0+818, gamevo 11+2 →
  0+452). `compare.ts` short-circuits numeric comparison at a structural
  diff, so removing the structural diff reveals every numeric diff behind
  it. Read a riser as `structural+numeric`, not as one number; a rise
  with structural falling is a reveal, not a regression.
- **Confidence**: High (row 79; memory: compareSvg count is non-monotone).

## Observation: the T6FU residual round paid for itself
- **Finding**: running a follow-up round on the merged batch tree
  (rows 76–77, five fix commits) before the close turned 9 more fixtures
  conformant than the task branches alone would have; each residual was
  a named half-ported branch of a method the task had already opened.
  Budget one residual round per batch, on the merged tree, before close.
- **Confidence**: Medium (one batch's sample).
