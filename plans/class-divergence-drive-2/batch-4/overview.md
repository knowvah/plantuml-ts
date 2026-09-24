# Batch 4 — R canvas 1 px + exit bar

Last by D2: the canvas is a function of every element's ink, now that
batches 1–3 have settled their neighbours. T18 closes the batch AND checks
the D8 exit bar, then decides batch 5 (D9).

| ID | Description | Agent | Writes (provisional) | Depends On | Done |
|---|---|---|---|---|---|
| T17 | Canvas ink term at its origin (11) | debugger (fix mode) | per `diagnosis/R.md` (likely `layout-ink-extent.ts`, `class-ink-*.ts`) + tests | T16 | [ ] |
| T18 | Residual round + close + exit bar + batch-5 decision | orchestrator | close-procedure write-set + `batch-5/*.md` or `planning/next-missions.md` | T17 | [ ] |
