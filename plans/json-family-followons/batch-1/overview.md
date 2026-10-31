# Batch 1 — re-render idempotence check, dead scale plumbing

Parallel: T1a and T1b share no file. Both are byte-neutral for every engine
(T1a writes no `src/`; T1b removes code that is a no-op at its only value, 1).
The close's all-engine chain must show **0 movers** (stop 5 binds; any mover
is a halt, not a re-pin).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-rerender-idempotence.md) | reproduce dot-engine re-render non-idempotence, read its contract, compare native graphviz (D3); file or close | debugger (opus), jff-T1a | `.agent-notes/jff-T1a.md`; conditional `docs/graphviz-issues/<n>-*.md`, `docs/graphviz-issues/TRACKER.md` | T0b close | [x] |
| [T1b](T1b-dead-scale-plumbing.md) | delete `NodeStyleJson.scale`, `scaleDasharray`'s `k`, stale `scale-geo` comments (item 4) | typescript-pro (sonnet), jff-T1b | `src/diagrams/json/renderer-style.ts`, `src/diagrams/json/json-renderer-highlight.ts`, their unit tests | T0b close | [x] |
| close | merge both; gates `b1`; chain `b1-eng` vs `b0-eng` = 0 movers; residue = b0close | orchestrator | per close-procedure | T1a, T1b | [x] |

No interface outputs: nothing in batch 2 consumes these.

T1b must not touch `renderer.ts` or `scale-at-emit.ts` (T2b owns them). If
deleting the field requires a `renderer.ts` edit, that is stop 1 — journal it
and fold the `renderer.ts` half into T2b.
