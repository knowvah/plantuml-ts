# Batch 7 — LaTeX `array` sizing (D6)

`src/core/latex-metrics/` sizes KaTeX's parse tree with JLaTeXMath 1.0.7's box
rules; the `array` node (a `<math>` matrix) has no handler in `HANDLERS`
(`nodes.ts:~103`). One task, one target, but a core change: it can move any
LaTeX/math fixture in any engine (40 of them), so stop 19 gates it.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T7a](T7a-latex-array-sizing.md) | port `MatrixAtom`/`ArrayOfAtoms` sizing | typescript-pro (sonnet) | `src/core/latex-metrics/matrix.ts`, `nodes.ts`, tests | B6 | [ ] |
| close | standard close, all-engine survey | orchestrator | per close-procedure | T7a | [ ] |
