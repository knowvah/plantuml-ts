# Batch 1 — the shell arms and the string-emitter engines

Five tasks in parallel worktrees off the batch-0 close; write-sets are
disjoint. T1a is core (`src/core/assemble-svg.ts`), so its merge is followed
by the all-engine chain at the close and every mover must be explained (stops
4, 8); it adds arms that no fragment reaches until T2f, so the expected mover
count is 0. T1b–T1d each spread the field from `theme.lengthAdjust` (D1, D4).
Then the standard close as `b1`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-shell-arms.md) | `finalizeShellFragment` arms for BOARD/FILES/PACKET/CHART (wrap an unwrapped body) | typescript-pro (sonnet) | `src/core/assemble-svg.ts` + `tests/unit/core/assemble-svg-lad-t1a.test.ts` | B0 | [ ] |
| [T1b](T1b-class.md) | class (+object): fragment `lengthAdjust` from theme | typescript-pro (sonnet) | `src/diagrams/class/renderer-document.ts` (+ T0d-named mirror) + test | B0 | [ ] |
| [T1c](T1c-state.md) | state: fragment `lengthAdjust` from theme | typescript-pro (sonnet) | `src/diagrams/state/renderer.ts` + test | B0 | [ ] |
| [T1d](T1d-json-yaml-hcl.md) | json/yaml/hcl: `renderJson` sets the field once | typescript-pro (sonnet) | `src/diagrams/json/renderer.ts` (+ T0d-named klimt site) + test | B0 | [ ] |
| [T1e](T1e-jar-compatible-seam.md) | D9 seam: `styleInput` cuts applied only in the internal jar-compatible mode; conformance callers opt in; files cut | typescript-pro (sonnet) | `src/index.ts`, `src/core/internal-render-options.ts`, `src/core/dispatcher-types.ts`, `src/diagrams/files/index.ts`, survey/census/authored harness + found callers, fitness test | B0 | [ ] |
| close | merge ×5, gates, baseline rebuild, all-engine chain vs b0 | orchestrator | per close-procedure | T1a–T1d | [ ] |

Expected authored movement at the close: class, object, state rows
`none`/`glyphs` → `rootExact`; their `textLengthMatch` → true (`none` via the
shell strip, `glyphs`/`default`/`onechar` already emitted). json/yaml/hcl rows
were already exact at b0 in the jar-compatible mode (Amendment 1) and stay so;
T1d/T1e add the extension, proven by unit tests and, at batch 3, examples.
Merge T1e LAST (it edits the authored harness T0c wrote and changes the
library default).
