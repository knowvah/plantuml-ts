# Decision journal (lgm)

| # | Date | Task | Decision / finding | Evidence |
|---|---|---|---|---|
| 1 | 2026-10-08 | T0a | Branch `feat/large-group-mirror` off main `6c0fb39e0` (brief commit on `b46435b10`). Added `measurements/elements.mts` + `elements-diff.py` (D5 reference tooling, c0a821ebd). | git log |
| 2 | 2026-10-08 | T0b | Launched T0b concurrently with the b0 survey rather than after it: T0b takes its own before/after survey in its worktree, so b0 is not its input; the only dependency (branch exists) is met. Agent told to re-run any engine that times out under the shared load. | push-forward: dependency already satisfied |
| 3 | 2026-10-08 | T0a | b0 at `c0a821ebd`: all 28 engines surveyed (`measurements/b0-eng`), 0 timeouts (load 4-10). Sequence: 1141 rows, Σ ws 306549, 13 error rows (all `status: error` in the baseline), 0 rises / 0 falls vs pins. Elements: 3402 fixtures across class/object/state/component/usecase/sequence/unknown, 0 render errors (`b0-elements.json`). vs committed parity-*.json: 56 movers, 0 conformant losses (committed files are older than unwind2's final state). Ledger b0 column filled. | measurements/b0-* |
| 4 | 2026-10-08 | T1a | Launched T1a during T0b: its dependency is b0 (done), write-sets disjoint (T1a: index.ts/chrome/harnesses; T0b: graph-layout*/svek-dot-lines0/dot layout). T1b held until T0b merges — its clipped-endpoint comparison reads edge coordinates T0b may re-quantize. | batch-1/overview.md Depends On = b0 |
