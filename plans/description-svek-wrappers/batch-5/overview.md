# Batch 5 — deroxu port-table node sizes (follow-on 2)

Serial. T9 runs only if T8's diagnosis names a mechanism inside description's write-set (D8, stop 11).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | Diagnose `unknown/deroxu-29-gude369`'s remaining layout divergence | debugger (sonnet) | journal entry only (via orchestrator) | T6 | [x] |
| T9 | Fix the named mechanism (conditional) | typescript-pro (sonnet) | the description file(s) T8 names + one test file | T8 | [x] |
| T10 | Measure + re-pin after T9 | orchestrator | as T6 | T9 | [x] |

If T8 ends in stop 11, skip T9/T10 and file the diagnosis artifact in `planning/next-missions.md` at T11.
