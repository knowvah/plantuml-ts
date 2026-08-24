# Batch 5 — the last four fixtures, and the one that needs both tasks

Two tasks, parallel: disjoint write-sets, neither consuming the other's
output. Together they close the final **4**.

**They are not independent in effect, and that is the point.**
`object/zuvila-56-nuda425` needs both. It is *detected* as `sequence`, so
narrowing sequence's arrow pattern (T7) only drops it to the dispatcher's
fallback — which routes it to its detected type, sequence, again. It closes
only when T6 also makes `classAccepts` claim `map` positively. Measured;
neither task fixes it alone, and neither should be scored as having failed
if the other has not landed.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T6 | [Class dispatch, both directions](T6-class-dispatch.md) | typescript-pro | `src/diagrams/class/class-dispatch.ts`, `tests/unit/class/class-dispatch.test.ts` | T5 | [x] |
| T7 | [Anchor the sequence arrow](T7-sequence-arrow.md) | typescript-pro | `src/diagrams/sequence/index.ts`, `tests/unit/sequence/accepts.test.ts` | T5 | [x] |
