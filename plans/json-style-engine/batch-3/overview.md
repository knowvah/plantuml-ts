# Batch 3 — extended mode and retiring the projection

Two parallel worktrees, disjoint files. T3b edits `src/core/`, so the close
runs the all-engine chain against b2 AND b0 (stop 5). The D6 check is the
point of this batch: every extended-mode mover is journaled with its
`FromSkinparamToStyle` line before any extension pin is re-pinned.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-extended-mode.md) | extended mode through `FromSkinparamToStyle` + the `defaultFontColor` wrapper (D4) | typescript-pro (sonnet), jse-T3a | `src/diagrams/json/{json-skin-param.ts,json-family-style-input.ts}`, `tests/unit/json/{renderer-style-extension,json-family-style-input}.test.ts` | T2a, T2b | [ ] |
| [T3b](T3b-retire-projection.md) | delete the json-family `StyleMap` projection (D3) | typescript-pro (sonnet), jse-T3b | `src/core/{style-map-json-diagram,style-map-theme}.ts`, `tests/unit/theme.test.ts`, `tests/unit/core/style-map-json-root-font.test.ts`, `tests/unit/yaml/highlight-styleclass.test.ts` | T2a, T2b | [ ] |
| close | merges; gates `b3`; chain vs b2 and b0; D6 check + journal; extension re-pins; `fixtures.md` b3 row | orchestrator | per close-procedure | T3a, T3b | [ ] |
