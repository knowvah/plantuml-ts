# T6 — Re-measure, re-pin, close out

**Agent:** orchestrator · **Depends on:** T5

## Task

1. Re-measure. Report Σ`weightedScore` against **43977** and the subset
   against **8218**, each with a percentage; the subset's line, polygon,
   childCount, width and x families before → after.
2. Re-pin the five baselines from ONE measurement (the previous mission's
   scratch `repin-activity.ts`, which already carries the text census).
   **Diff every re-pinned baseline and name every pin that ROSE** with its
   mechanism (the packing delta is a named one).
3. Confirm sequence, state, class, description, json unmoved with counts
   (run `tests/oracle/svg-conformance` minus `activity.*` at HEAD and at
   `b7c293c6` in a worktree with `node_modules` and `assets/stdlib` linked,
   JSON reporter, compare per file).
4. `planning/next-missions.md`: resolve `activity-parallel-connectors`;
   file **C2** (`klimt/compress` port: `CompressionXorYBuilder`,
   `SlotFinder`, `SlotSet`, `CompressionTransform`,
   `PiecewiseAffineTransform`, `UGraphicCompressOnXorY`; the drawing-
   interception seam it needs; the packing and lane-clipped-bar deltas it
   would collect, measured), the if/switch connector shape, and anything
   T1 filed.
5. Append a Close-out to the brief README: scored exit bar, premises
   measured false, follow-ons with measured weight.

## Acceptance criteria

- Given the re-measure, then Σ and the subset are stated before → after
- Given each re-pinned baseline, then every risen pin is named with a
  mechanism, or the report states none rose
- Given the sibling suites, then each is reported unmoved with a count
- Given all four gates at HEAD, then all four are green; the coverage-free
  JSON run lists every test file

## Boundaries

**Ask first (halt and journal):** if Σ`weightedScore` did not fall.

## Observability / Rollback

N/A / **Reversible** (baseline JSON and docs only).

## Commit

`test(apc-T6): re-pin the activity baselines and close out`
