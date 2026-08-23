# Batch 1 — the two independent halves

T1 ports the shape vocabulary; T2 opens the shell route. Neither depends on
the other, and their write-sets do not overlap, so run them in parallel. T2
is unit-testable by feeding `assembleSvg` a synthetic fragment carrying
`diagramType: 'SEQUENCE'` — it does not wait on the renderer.

Nothing in this batch changes any rendered output: T1 adds an unused module,
T2 adds an unreachable dispatch case. `render-manifest` must be unmoved at
the end of the batch. That is the check that both tasks stayed in their lane.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T1 | [Arrow shape vocabulary](T1-arrow-shape-vocabulary.md) | typescript-pro | `src/diagrams/sequence/sequence-arrowhead.ts`, `tests/unit/sequence/sequence-arrowhead.test.ts` | — | [ ] |
| T2 | [Sequence document shell](T2-sequence-document-shell.md) | typescript-pro | `src/core/assemble-svg.ts`, `tests/unit/core/assemble-svg.test.ts` | — | [ ] |
