# T10 — stroke-width and rx/ry

Prepend [../task-preamble.md](../task-preamble.md). Worktree `codd/T10` (or collapsed into T7; see
the overview).

## Rows
fuzula-86-temo881, rimiku-31-cigo272, xadinu-90-vasu322 (1–3 diffs); nufofe-18-xani887,
reroca-56-safi108 (4–10). Render-diffs are in `measurements/seed/rd/`.

## Task
1. For each row, find the jar's source of `stroke-width` or `rx/ry`: `skinparam` RoundCorner,
   `<style>` LineThickness/RoundCorner, a stereotype, or a `USymbol` default. Quote the Java
   (`USymbol*.java`, `SymbolContext`, `style/PName`).
2. Group by mechanism and fix each at its origin.

## Write-set
- `src/diagrams/description/renderer-entity.ts`, and the style/skinparam resolution files where a
  stated mechanism lives (core falls under D5)
- `tests/unit/description/**`, `tests/unit/core/**` for touched modules

## Acceptance
- Given the 5 rows, then their stroke-width/rx/ry diffs are 0, or the residual has a mechanism.
- Given the surveys, then there are zero conformant losses.

**Observability:** N/A. **Rollback:** Reversible.
