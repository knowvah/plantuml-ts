# Batch 3 — G21 accumulator wiring (serial)

`buildConcurrentBranchAcc` calls `newAccumulator()` with no arguments, so a
concurrent region's `PassAccumulator` carries neither `labelFont` nor
`measurer`. Every region-local labeled transition therefore fails
`attachInlineTransitionLabel`'s `measured !== undefined` gate, silently
discards graphviz's real `labelX/labelY`, and falls back to a
perpendicular-offset heuristic — so the label's real box never reaches the
region's ink extent. The two sibling call sites both pass the arguments.

**This changes drawn output**, not only declared size: every such label moves
to graphviz's real placement. Manifest moves are expected and must each carry
a jar-side account.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Pass `labelFont`/`measurer` at the third `newAccumulator` call site; verify `jetuse-93` under the same hypothesis | typescript-pro (sonnet) | `src/diagrams/state/state-composite-concurrent.ts`, `tests/unit/state/state-composite-concurrent.test.ts` | T2 | [x] |
