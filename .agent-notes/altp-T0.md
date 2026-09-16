# altp-T0 — observations (`activity-loop-tile-port`, 2026-09-16)

## Observation: `npm run build` can print `error TS` lines for `node:` imports and still exit 0

- **Context**: running the four gates for T0 while a sibling agent worked in
  `.claude/worktrees/<agent>` (a worktree INSIDE the repo, without its own
  `node_modules`).
- **Finding**: one `vite build` printed three `TS2591`/`TS2503` errors
  ("Cannot find name 'node:fs/promises'", "Cannot find namespace 'NodeJS'")
  for `src/core/include-resolver-node.ts` from `vite-plugin-dts`, exit code
  0. An immediate rebuild at the same commit printed 0 such lines; the
  baseline commit printed 0. `npm run typecheck` was clean on every run.
- **Impact**: aitp-T7 recorded three agents reporting "pre-existing build TS
  errors" the orchestrator never reproduced; this is that report, reproduced
  once. The build gate is the exit code; count `error TS` lines and rerun
  once before treating them as a defect. A worktree inside the repo is the
  one variable present on the failing run and absent on the clean ones --
  unproven.
- **Confidence**: Medium (seen once; mechanism not isolated).
