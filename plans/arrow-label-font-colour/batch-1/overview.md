# Batch 1 — theme fields, skinparam path, resolver (zero movement)

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `arrowFontColor`/`cardinalityFontColor` theme fields; `arrowfontcolor` + `defaultfontcolor` handlers; `resolveArrowLabelFont` returns `color`; `resolveCardinalityFontColor` | `typescript-pro` (sonnet) | `src/core/theme-graph-colors-a.ts`, `src/core/theme.ts`, `src/core/skinparam-accumulator.ts`, `src/core/skinparam-key-handlers.ts`, `src/core/skinparam-theme-builder.ts`, `src/core/arrow-label-font.ts`, `tests/unit/skinparam.test.ts`, `tests/unit/core/arrow-label-font.test.ts`, `tests/unit/core/theme.test.ts` | — | [ ] |

**Before T1:** capture the start baseline in a detached worktree at the
branch point — `shape-match-report`, `dot-sync-report` ×5, and the full
per-engine SVG dumps (class, component, usecase, state, object). **Batch
exit:** four gates; DOT EQUAL unchanged; every SVG dump byte-identical (no
renderer reads the colour yet).
