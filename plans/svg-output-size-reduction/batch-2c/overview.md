# Batch 2c — State cleanup, formatter retirement, golden regeneration

⚠️ **Gate deferred (ADR-5).** Full gates run at the end of batch-2d.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7 | Remove state-engine pre-rounding | typescript-pro | `src/diagrams/state/**` (4 files) | T5 | [x] |
| T7b | Route hand-built markup through shared emitters | (inline) | `core/svg-path-builder.ts`, class/state renderers | T5, T6a–T6e | [x] |
| T8 | Retire `number-format.ts`'s 4-decimal API | typescript-pro | `src/core/number-format.ts`, `src/core/openiconic-glyphs.ts` | T6a–T6e, T7 | [x] |
| T9 | Regenerate the 446 `in.puml` goldens | general-purpose | `oracle/goldens/svg-*/**/golden.svg` | T2 | [x] |
| T9b | Re-baseline the 4 `svg-conformance` goldens | typescript-pro | `oracle/goldens/svg-conformance/**` | T3, T4, T9 | [x] |

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

## T9 does not cover everything — T9b exists because of that

**Added 2026-08-08 during T2.** T9's script walks `in.puml`, and there are
446 of those against **450** committed goldens. The 4-file gap is all of
`oracle/goldens/svg-conformance/`, whose cases are hand-authored TypeScript
with no `.puml` — and which drive the klimt emitter, so T3/T4 turn them
red. T9b re-baselines them from the jar via three different provenance
paths (one of them a hand-wrapped fragment that must be re-derived, not
re-captured). Without T9b, batch-2d's full `npm test` gate cannot pass.

T9b depends on T3/T4 as well as T9: verifying its goldens means running
the conformance suite against the **ported** emitter.
