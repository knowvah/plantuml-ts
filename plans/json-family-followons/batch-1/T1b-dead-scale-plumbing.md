# T1b — delete the dead json scale plumbing (item 4)

Agent: typescript-pro (sonnet, effort medium), worktree `jff-T1b`. Include
[../task-contract.md](../task-contract.md). Commit: `refactor(json): drop the
pre-T4a node-style scale factor (T1b)`.

## Context
jfp T4a moved json's `scale` to emit time and deleted `scale-geo.ts`. What fed
the old pre-scale path is still here and is always 1 (`.agent-notes/jfp-b1.md:26-29`):
- `NodeStyleJson.scale` (`src/diagrams/json/renderer-style.ts:97-102`, set to 1 at `:193`), with stale `scale-geo.ts#scaleNodeStyle` comments at `:54-56`, `:64-65`, `:97-101`;
- `json-renderer-highlight.ts:35-38` multiplies the highlight rect's literals by `style.scale` and calls `scaleDasharray(…, k)` (`:54`, defined `:68-71`, a no-op at `k === 1`); comments at `:18-19`, `:35-37`, `:62-65`.

The highlight rect's literal insets are upstream's (`TextBlockJson.java`;
quote the lines you keep). At 1x, `x * 1` and `scaleDasharray(d, 1)` are
identities, so removal is byte-neutral — but `fmt` rounding inside
`scaleDasharray` is NOT reached at `k === 1` (it returns early), so the dash
string is emitted verbatim today; keep it verbatim.

## Task
Remove the field, its initialiser, the multiplications, `scaleDasharray` (grep
`src/` and `tests/` for other callers first; delete only if none), and the
stale comments; reword the remaining comments to say scale is applied at emit
by core (`TextBlockExporter#exportTo` after batch 2 — say "at emit", not a file
that batch 2 will change). Update or delete unit tests that asserted the
removed behaviour (reason in the commit body).

## Write-set
`src/diagrams/json/renderer-style.ts`, `src/diagrams/json/json-renderer-highlight.ts`,
the unit tests that import them (find with grep under `tests/unit/json/`).

## Read-set
`src/diagrams/json/renderer-style.ts:50-110,185-200`,
`src/diagrams/json/json-renderer-highlight.ts`,
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java` (the highlight draw).

## Acceptance
- Given the change, when `grep -rn "scale-geo\|scaleNodeStyle\|scaleDasharray\|style\.scale" src/` runs, then it prints nothing.
- Given the json/yaml/hcl surveys and the positional gate, then every row is byte-identical to b0close (`diff-one.mts` on the highlight fixtures: `tests/fixtures/json/{header-highlight,highlight-stereotype,style-highlight-block}`).
- Given `npm run typecheck` and the json unit tests, then both are green.

Observability: N/A. Rollback: Reversible.
