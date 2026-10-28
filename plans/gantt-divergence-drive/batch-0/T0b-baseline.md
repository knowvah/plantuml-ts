# T0b — baseline measurement (b0)

Agent: orchestrator. Commit: `chore(gdd-b0): baseline measurement`.

## Steps
1. `uptime`; above ~10 wait. `bash $M/gates.sh b0`: collected = on-disk, 0
   failed, typecheck/lint/build exit 0. Then the d.ts snapshot (T0a step 5).
2. `LOAD_MAX=8 SVG_PARITY_TIMEOUT_MS=900000 SVG_PARITY_CONCURRENCY=3 bash $M/chain.sh b0-eng`
   (28 engines). Self-check: `node $T/verdict-diff.mjs $M/b0-eng $M/b0-eng` = 0 movers.
3. Gantt: expect 263 conformant / 1 structural-match / 1 diverged / 0 errored
   (`xikovo-87-rosu902`, `xureco-57-lene839`). Journal row 1 with the per-engine counts.

## Acceptance
- Given the b0 chain, then every engine has a `parity-<engine>.json` and gantt reads 263/1/1/0.
- Given the gates, then `b0-vitest.json` collected equals on-disk.

Observability: N/A. Rollback: Reversible.
