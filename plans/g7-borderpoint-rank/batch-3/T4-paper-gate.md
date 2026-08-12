# T4 — Paper gate (D3): re-derive the three target bboxes

## Locked inputs

The adjudicated builder spec (T2's Round-3 addendum, or issue 09 +
T3's verified new build); G6 `batch-4/withlabel-derivation.md` Rounds
1-2 (FrontierCalculator terms: `initial`/`insides`/`points`;
title-table formula); D4 (`<<O-O>>` sentinel exclusion — jar
`Stereotype.isWithOOSymbol()`; port AST value bracket-stripped
`"o-o"`; pesita `AA` titleTableHeight must come out 28, NOT 42).

## Task

ON PAPER (no production code; probe arithmetic scripts fine), walk
each target fixture through the full adjudicated pipeline — DOT shape
(ranks, ee, i-wrapper) → expected dot-engine layout (`initial`) →
FrontierCalculator correction → final bbox:

- pesita-10-dene726 `AA` (nested in nasreq_auth, groupTouched,
  `<<O-O>>` stereotype) → must reproduce **126 × 104.72**
- kotagu-43-miza629 `CompositeState` (pseudo-node + nested child in
  ee) → must reproduce **289 × 358**
- bitaxo-18-tamo974 `C` (control) → must reproduce **42 × 101.72**

No fixture-specific terms. Cross-check intermediate values against
each fixture's real cached svek DOT + real-dot layout where possible.

## Write-set

Append a "Paper gate (G7 T4)" section to
`plans/g6-cluster-geometry/batch-4/withlabel-derivation.md` with the
three walkthroughs + the spec deltas vs attempt 3. Probes deleted.

## Interface contract (consumed by T5)

Per-fixture: predicted bbox + every intermediate (titleTableHeight,
rank-group names, i-wrapper firing, initial bbox, frontier inputs).
Plus an exact edit list: what T5 does DIFFERENTLY from attempt 3
(recoverable from `git show` on the reverted attempt — journal row
2026-07-22 lists the six files).

## Acceptance criteria

- Given the spec + D4, when applied on paper, then all three targets
  reproduce exactly — else STOP before any code (README cond. 6).

## Boundaries

No production edits; no tuning; no git mutations.
