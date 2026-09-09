# Batch 1 — the shared core

One task, in `src/core/`. Serial and alone: its blast radius is every
engine, which is why [D4] is scoped to a single alias split and why the
acceptance criteria demand a proof that no other engine's theme moves.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Wire the three absent swimlane skinparams; un-alias `SwimlaneBorderColor` | typescript-pro | `src/core/skinparam-key-handlers-table-b.ts`, `src/core/skinparam-accumulator.ts`, `src/core/skinparam-theme-builder.ts`, `src/core/theme-graph-colors-b.ts`, `tests/unit/skinparam.test.ts` | — | [x] |
