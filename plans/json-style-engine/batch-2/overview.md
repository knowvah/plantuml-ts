# Batch 2 — measurement and paint read the engine

Two parallel worktrees, disjoint files, both consuming `JsonStyleSet` (T1b)
from `ast.skinParam` (T1a). Jar-compatible pins must stay byte-equal; the
target rows move. The close re-pins nothing in jar-compatible mode unless it
moved toward the jar.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-measurement.md) | row measurement with the per-row style font | typescript-pro (sonnet, effort high), jse-T2a | `src/diagrams/json/{TextBlockJson.ts,layout.ts}`, `tests/unit/json/{layout,text-block-style}.test.ts` | T1a, T1b | [ ] |
| [T2b](T2b-paint.md) | paint from the engine: fill/stroke/round corner, gradient, header font colour, stereotype highlight, separator, arrow | typescript-pro (sonnet, effort high), jse-T2b | `src/diagrams/json/{renderer-style.ts,renderer.ts,json-renderer-highlight.ts}`, `tests/unit/json/{renderer,renderer-engine-style}.test.ts` | T1a, T1b | [ ] |
| close | merges; gates `b2`; chain vs b1; D6 check; manifest appends; `fixtures.md` b2 row | orchestrator | per close-procedure | T2a, T2b | [ ] |
