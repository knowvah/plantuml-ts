# T6 — re-pin once and close out

**Orchestrator only** — `scripts/repin-activity-baselines.ts`'s own header
forbids task agents writing a baseline. **Depends on:** T4 (and T5 if run).

## Task

1. Adjudicate: `npx vitest run tests/oracle/svg-conformance/activity*` — list
   every rise; each must be classed (element growth under positional pairing,
   reorder, snake-merge per D7, pre-existing divergence made visible) with a
   journal row, or it is stop 4.
2. Copy `oracle/goldens/svg-activity/*.json` to `../measurements/goldens-before/`.
3. `npx jiti scripts/repin-activity-baselines.ts` (read its header for the
   flags it takes). Diff every changed pin against the copy: any pin that ROSE
   without a journal row is an adopted regression (memory
   `repin-script-raises-preexisting-red-pin`) — revert that entry and stop.
4. All four gates; JSON-reporter collected count = on-disk count.
5. `../README.md`: tick the batch table; append the mission summary (tasks
   done vs planned, decisions amended, gate results, aggregate before/after,
   residuals with cites). `planning/next-missions.md`: mark the entry
   EXECUTED with the commit, re-file residuals. Memory note per the memory
   rules. Commit `test(allt-T6): re-pin activity baselines after loop lane translate`.

## Acceptance criteria

- Given the rise list, then empty or every rise classed and journaled
- Given the re-pin diff, then no unexplained rise; falls only
- Given all four gates, then green with collected = on-disk
- Given `README.md`, then the summary is at the bottom and every batch is ticked

## Observability / rollback

N/A — no new observable operations. Reversible: the re-pin commit reverts
cleanly with the code it measures (revert the merge, not this commit alone).
