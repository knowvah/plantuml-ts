# Batch 4 — R canvas 1 px + exit bar

Last by D2: the canvas is a function of every element's ink, now that
batches 1–3 have settled their neighbours. T18 closes the batch AND checks
the D8 exit bar, then decides batch 5 (D9).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T17 | Canvas ink term at its origin (9): R-1, R-2, R-3 + diagnose R-5/6/7/9 | debugger (fix mode) | `class-ink-box.ts`, `class-ink-shapes.ts`, `class-layout-generic-classifier.ts`, `class-geo-types.ts`, `class-object-sizing.ts`, `layout-ink-extent.ts` + tests | T16 | [x] |
| T18 | Residual round + close + exit bar + batch-5 decision | orchestrator | close-procedure write-set + `batch-5/*.md` or `planning/next-missions.md` | T17 | [x] |
