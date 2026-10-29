# T0b — extended-mode byte baseline (D6)

Agent: `typescript-pro` (sonnet), worktree `jse-T0b`. Commit:
`test(jse): extended-mode byte baseline tool (T0b)`. Read [../task-contract.md](../task-contract.md).

## Context
Every json/yaml/hcl gate measures jar-compatible mode except
`extensions.ratchet.test.ts` (24 examples). This mission rewrites style
resolution in BOTH modes; an extended-mode change anywhere else is invisible
today. The tool closes that gap for the mission's duration.

## Task
`plans/json-style-engine/tools/extended-baseline.mts`:
- Rows: every `test-results/dot-cache/{json,yaml,hcl}/<slug>/in.puml`, every
  `tests/fixtures/{json,yaml,hcl}/<slug>.puml` with a `.svg`, every
  `tests/fixtures/extensions/{json,yaml,hcl}-*.puml` (and `.plain.puml`).
- Render each with `renderSync(markup, { measurer: new DeterministicMeasurer(), assetStore })`
  — EXTENDED mode (no `withJarCompatibleStyleInput`), the emoji/sprite store the
  survey uses (`scripts/svg-parity-survey.ts:77-80`, via the test helpers).
- `--write <map.json>` writes `{ "<type>/<slug>": "<sha256>" }` sorted;
  `--check <map.json>` prints `MOVED <id>` / `ADDED <id>` / `GONE <id>` and a
  count line, exit 1 on any MOVED or GONE (ADDED is informational).
- A pure core (`hashRows(rows, render)`) exported for the test, the CLI a thin wrapper.
`extended-baseline.test.mts` (run with `$M/vitest.config.mts`): a fabricated row
set and a fake render prove MOVED/ADDED/GONE and the sort order.

## Write-set
`plans/json-style-engine/tools/extended-baseline.mts`, `plans/json-style-engine/tools/extended-baseline.test.mts`.

## Read-set
`scripts/svg-parity-survey.ts:60-90,300-320`, `tests/helpers/{emoji,sprite}-assets-store.ts`,
`tests/oracle/svg-conformance/extensions.ratchet.test.ts:1-70`,
`plans/json-style-engine/measurements/vitest.config.mts`.

## Acceptance
- Given an unchanged tree, when `--write` then `--check` run, then 0 MOVED / 0 GONE.
- Given a fake render that changes one row's bytes, then the test sees exactly `MOVED <that id>`.
- Given a removed fixture, then `GONE <id>` and exit 1.

Observability: N/A. Rollback: Reversible.
