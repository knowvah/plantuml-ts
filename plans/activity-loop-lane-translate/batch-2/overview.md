# Batch 2 — sweep, optional ride-alongs, re-pin

Sequential after Batch 1 is merged.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Corpus sweep; diagnose every residual on the classified rows; fix in-scope ones | debugger | Batch 1 write-set, `fixtures.md`, journal, `.agent-notes/allt-T4.md` | T2, T3 | [x] |
| T5a | (optional, D9) repeat `break` welding | typescript-pro | `walk-repeat.ts` + its test | T4 | struck (D9, T0) |
| T5b | (optional, D9) `GtileBreak` 0x0 | typescript-pro | `tiles/gtile-break.ts` + its test | T4 | struck (D9, T0) |
| T6 | Re-pin ONCE; close out | orchestrator | goldens, `README.md` summary, `next-missions.md` | T4 (T5) | [x] |

Specs: [`T4-sweep.md`](T4-sweep.md), [`T5-ride-alongs.md`](T5-ride-alongs.md),
[`T6-repin.md`](T6-repin.md). T5 runs only if T0 journaled "T5 confirmed".
