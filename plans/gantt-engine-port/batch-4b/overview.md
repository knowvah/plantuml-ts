# Batch 4b — `net.sourceforge.plantuml.real` (D12, Amendment 2)

T4d ports the `real` constraint package whole to `src/core/real/` in its own
worktree `gep-T4d` off the batch-3 close (`d02d69a19`). The package is one
dependency cycle (`Real*` ↔ `RealLine` ↔ `PositiveForce`), so it is one task.
T4d then merges into the mission branch (no close of its own); the
orchestrator merges the mission branch into `gep/T4a`, and T4e ports T4a's
two remaining files (`TaskDraw`, `TaskDrawSeparator`) on `gep/T4a`.

Close: batches 4 and 4b close together as `b4` (one gates run, one 28-engine
chain vs b3, 0 movers expected — no engine imports `src/core/real/` yet, and
sequence keeps `src/diagrams/sequence/sequence-real-line.ts` untouched).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T4d](T4d-real-package.md) | `real/` → `src/core/real/` (15 files, 1,332 lines) + upstream `RealMaxRecursionGuardTest` | typescript-pro (sonnet) | `src/core/real/` ×15 + tests | B3 | [x] |
| [T4e](T4e-taskdraw-separator.md) | `draw/TaskDraw`, `draw/TaskDrawSeparator` (318 lines) on `gep/T4a` | typescript-pro (sonnet) | `src/diagrams/gantt/draw/` ×2 + tests | T4d, T4a | [x] |
| close | with batch 4 (see [../batch-4/overview.md](../batch-4/overview.md)) | orchestrator | per close-procedure | T4e, T4b, T4c | [x] |
