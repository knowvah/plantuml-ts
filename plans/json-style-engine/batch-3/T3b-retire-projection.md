# T3b — delete the json-family StyleMap projection (D3)

Agent: `typescript-pro` (sonnet), worktree `jse-T3b`. Commit:
`refactor(core): retire the json-family StyleMap projection (T3b)`.
Read [../task-contract.md](../task-contract.md) and [../decisions.md#d3](../decisions.md).

## Context
After batch 2 no json/yaml/hcl source reads `Theme.colors.graph.json`
(verify with a grep first; if one still does, stop 1 — report it).
`src/core/style-map-json-diagram.ts` (`computeJsonFamilyOverride`,
`computeYamlFamilyOverride`, `computeHighlightClassesOverride`, the `compute*`
helpers) and `style-map-theme.ts#computeJsonGraphOverride` populate it. Named
themes may also seed `colors.graph.json` (`src/core/theme.ts:~317`,
`theme-merge.ts:21`) — read who else reads it before deleting anything.

## Task
- Delete the json-family projection functions and their call in
  `style-map-theme.ts`; keep the `Theme` / `ThemeGraphColorsC` TYPE (public d.ts, stop 6).
- Tests asserting projection values: re-point at the engine (assert the
  rendered SVG or `resolveJsonStyles`) or delete with the reason in the commit body.
- If a non-json consumer of `colors.graph.json` exists, keep what it needs and say so.

## Write-set
`src/core/style-map-json-diagram.ts`, `src/core/style-map-theme.ts`,
`tests/unit/theme.test.ts`, `tests/unit/core/style-map-json-root-font.test.ts`,
`tests/unit/yaml/highlight-styleclass.test.ts`.

## Acceptance
- Given `grep -rn "graph.json\|graph\\.json" src/diagrams/{json,yaml,hcl}`, then no hit.
- Given `npm run build && cmp dist/plantuml-ts.d.ts plans/json-style-engine/measurements/b0-plantuml-ts.d.ts.txt`, then identical.
- Given `npx vitest run tests/oracle/svg-conformance tests/unit --maxWorkers=2 --coverage.enabled=false`, then green; list any mover.

Observability: N/A. Rollback: Reversible.
