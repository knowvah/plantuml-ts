# Batch 1 — the two independent foundations

Both tasks are prerequisites for later batches and share no files, so they run
in parallel. Neither touches the class engine.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | klimt fragment-emission seam (ADR-2) | typescript-pro | `src/core/klimt/document-shell.ts`, `tests/unit/core/klimt/fragment-emission.test.ts` | — | [ ] |
| T2 | retire `usecase-footprint.ts`; delete `measureActor` (ADR-3, ADR-4) | typescript-pro | `src/diagrams/description/leaf-sizing.ts`, `src/diagrams/description/leaf-sizing-text.ts`, `src/diagrams/description/usecase-footprint.ts` (delete), `tests/unit/description/footprint-parity.test.ts` | — | [ ] |

## Why these two are independent

T1 works entirely inside `src/core/klimt/`, adding a way to render a
`UDrawable` to an SVG **fragment**. T2 works entirely inside
`src/diagrams/description/`, swapping which fit implementation the `<latex>`
route calls. They meet only in batch 3.

## Risk to watch

T1 carries this mission's largest unknown — element-id collision across
per-node documents (ADR-2). If T1 finds that collisions cannot be prevented
without touching `svg-graphics-core.ts`, that is **stop condition 5**: journal
it and escalate rather than widening the write-set.

T2 carries the mission's sharpest measurement risk — `widened` must stay 0. If
the two fit mechanisms disagree numerically, take ADR-3's stated fallback
(partial retirement, recorded as partial) rather than accepting movement.
