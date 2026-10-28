# Batch 0 — branch, tooling, baseline, authored fixtures

Serial. T0a and T0b are the orchestrator's; T0c runs in a worktree once the
branch exists. The b0 measurement is the loss reference for every later close.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-and-tooling.md) | ff local main to `01fe0c79b`, `npm ci`, branch, commit the brief, tooling copied from gep, d.ts snapshot, `diff-one.mts` | orchestrator | `plans/gantt-divergence-drive/**`, `.claude/settings.autonomous.json` | — | [x] |
| [T0b](T0b-baseline.md) | gates b0, all-engine chain b0-eng, gantt counts | orchestrator | `$M/b0*`, `$M/b0-eng/` | T0a | [x] |
| [T0c](T0c-authored-fixtures.md) | five authored fixtures + jar oracles | typescript-pro (sonnet), gdd-T0c | `tests/fixtures/gantt/{emoji-separator,emoji-note,title-hide-footbox,header-hide-footbox,caption-hide-footbox}.{puml,svg}` | T0a | [x] |
| close | merge T0c; authored baseline re-pinned (four rows expected red at b0 and recorded as such); `fixtures.md` b0 row | orchestrator | per close-procedure | T0b, T0c | [x] |
