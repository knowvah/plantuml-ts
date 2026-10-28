# Batch 1 — D1 seam, xikovo diagnosis, emoji threading, pin tooling

Four tasks in parallel worktrees off the batch-0 close; write-sets disjoint.
T1a is a core commit: the close runs the all-engine chain (stop 4/15). T1b
writes no code — its artifact feeds T2a. The close also records D4 (nakude,
mogafu) in `fixtures.md`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-none-transparent-equality.md) | `paintsEqual` equates the string none and a transparent `HColorSimple` (D1) | typescript-pro (sonnet), gdd-T1a | `src/core/klimt/drawing/svg/driver-path-svg.ts`, `tests/unit/core/klimt/drivers.test.ts` | — | [ ] |
| [T1b](T1b-xikovo-diagnosis.md) | diagnosis artifact: where the hidden footer's 8 px is lost under top chrome (D2) | debugger (opus, effort high), gdd-T1b | `plans/gantt-divergence-drive/diagnosis/xikovo.md` | T0c | [ ] |
| [T1c](T1c-emoji-store-threading.md) | separator titles and note sheets draw from the injected emoji store (D3) | typescript-pro (sonnet), gdd-T1c | `src/diagrams/gantt/draw/TaskDrawSeparator.ts`, `src/diagrams/gantt/draw/AbstractTaskDraw.ts`, `tests/unit/gantt/draw/{TaskDrawSeparator,AbstractTaskDraw}.test.ts` | T0c | [ ] |
| [T1d](T1d-pin-tooling.md) | `pin-gantt.mts` refuses accepted / stock-error slugs (D5) | tooling-engineer (sonnet), gdd-T1d | `plans/gantt-divergence-drive/measurements/pin-gantt.mts`, `pin-gantt.test.mts` | — | [ ] |
| close | merges; gates; chain vs b0 (T1a core); pin xureco (T1d's script); emoji fixtures to the authored baseline; nakude + mogafu closed (D4); `fixtures.md` b1 row | orchestrator | per close-procedure | T1a–T1d | [ ] |
