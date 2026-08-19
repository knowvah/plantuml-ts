# Batch 2 — G17 note-only region (serial)

A `--`-delimited concurrent region containing ONLY a note has no materialized
states, so `regionInkGeometry`'s ink is the degenerate `{0,0}` and its
`Math.max` falls through to dot-engine's raw graph canvas — which bakes in a
flat +12 margin where the jar applies `SvekResult#calculateDimension`'s +15.
Six rows on one fixture, arithmetic closing to the pixel on one constant.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | `regionInkGeometry` degenerate-ink branch seeds from raw node boxes + `SvekResult.java:135`'s 15 | typescript-pro (sonnet) | `src/diagrams/state/state-composite-concurrent.ts`, `tests/unit/state/state-composite-concurrent.test.ts` (or the nearest existing unit test for this module) | T1 | [ ] |
