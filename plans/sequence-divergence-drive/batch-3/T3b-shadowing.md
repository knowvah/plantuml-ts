# T3b — shadowing helpers onto `paint.shadowing`

Agent: `typescript-pro`, worktree `sdd1-T3b`. Commit:
`fix(sequence): read shadowing from each element's merged style`.
**Read [../batch-2/family-contract.md](../batch-2/family-contract.md) first —
it is part of this prompt.**

## The family
Drop shadows. Upstream reads each element's shadow off its own merged
`Style` (`Style.getShadowing`, `Style.java:109-115,277-281`), captured per
event. The port resolves one `graph.sequenceShadowing` per document in
`src/core/sequence-shadowing.ts` and threads it through the theme; its head
comment records the per-event capture as "Not modelled". Batch 2 families
switched their own reads to `paint.shadowing`; this task moves the two
shared helpers.

## Task
1. `sequence-shadow.ts` and `sequence-layout-note-shadow.ts` take the
   shadow value from the element's `paint.shadowing` (or a `Style`), not
   from `theme.colors.graph.sequenceShadowing`.
2. Tests: `skinparam shadowing true` before vs after an element (per-event
   capture now visible); `<style> note { Shadowing 4 }`.
3. Report every remaining reader of `sequenceShadowing` (grep) for T3c.

## Write-set
`src/diagrams/sequence/{sequence-shadow,sequence-layout-note-shadow}.ts`,
their tests under `tests/unit/sequence/`.

## Read-set
`family-contract.md`; `src/core/sequence-shadowing.ts` (whole, read only);
both write-set files (whole); `tests/unit/core/sequence-shadowing.test.ts`
(the cases to carry over); `sequence-skin-param.ts` (`paintOf`).

## Acceptance
- Given `skinparam shadowing true` placed after the first message, then only
  later elements carry a shadow (per-event capture, D2).
- Given the default skin, then no element draws a shadow (`plantuml.skin:92`).
- Given `grep -rn sequenceShadowing src/diagrams/sequence`, then the only
  matches are files outside this write-set, each listed in the hand-back.
- Given the shadowed rows at b2, then no row rises without a mechanism.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A — no new
observable operations. Rollback: Reversible.
