# Batch 2c — State cleanup, formatter retirement, golden regeneration

⚠️ **Gate deferred (ADR-5).** Full gates run at the end of batch-2d.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7 | Remove state-engine pre-rounding | typescript-pro | `src/diagrams/state/**` (4 files) | T5 | [ ] |
| T8 | Retire `number-format.ts`'s 4-decimal API | typescript-pro | `src/core/number-format.ts`, `src/core/openiconic-glyphs.ts` | T6a–T6e, T7 | [ ] |
| T9 | Regenerate all 450 goldens | general-purpose | `oracle/goldens/svg-*/**/golden.svg` | T2 | [ ] |

**Parallelism.** T7 runs in parallel with all of batch-2b (disjoint files) —
the executor may start it as soon as T5 lands rather than waiting for 2b to
finish. T8 must follow every T6 task **and** T7, because it can only delete
`javaFixed4`/`javaRound4` once the last caller is gone. T9 depends only on
T2 and touches no source at all, so it can run at any point after batch-1.

## T9 is independent of the port

The goldens are captured from the **jar**. Regenerating them does not read
our renderer, so T9 could equally run first. It is placed here so that the
executor reaches batch-2d with both halves — ported emitters and fresh
goldens — in place, which is the first moment the suite can be green.
