# Batch 0 — branch, tooling, extended-mode baseline, authored fixtures

Serial: T0a first (branch + tooling + b0 baseline), then T0b and T0c in
parallel (disjoint write-sets). The close captures the D6 extended-mode
baseline with T0b's tool and records the b0 counts row.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-and-tooling.md) | branch, brief commit, tooling copied from ddc, b0 gates + chain + d.ts snapshot | orchestrator | `plans/json-style-engine/{measurements,tools}/*` (copies), `.claude/settings.autonomous.json` | — | [x] |
| [T0b](T0b-extended-baseline.md) | extended-mode byte-baseline tool (D6) | typescript-pro (sonnet), jse-T0b | `plans/json-style-engine/tools/extended-baseline{.mts,.test.mts}` | T0a | [x] |
| [T0c](T0c-authored-fixtures.md) | authored fixtures with jar oracles for the gaps (D7) | typescript-pro (sonnet), jse-T0c | `tests/fixtures/{json,yaml,hcl}/<new slugs>.{puml,svg}` | T0a | [x] |
| close | merge T0b/T0c; gates `b0close`; `extended-baseline.mts --write`; manifest appends for clean new rows; `fixtures.md` b0 row | orchestrator | per close-procedure | T0b, T0c | [x] |
