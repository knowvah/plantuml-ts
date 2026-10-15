# T6 — text x/y diagnosis (read-only, D6)

**Agent:** `debugger`, read-only. Use Read/Grep/Glob/Bash only: no Write/Edit, no Serena edit tools.
Return the report in your reply; the orchestrator writes `measurements/T6-diagnosis.md`.
Prepend [../task-preamble.md](../task-preamble.md), then disregard its commit and worktree sections.

## Rows
- **text-xy only:** babafi, bitexe, buduco, butebe, cigite, fimoxe, fodena, gafico, gevaje,
  keniji, kokebo, luniju, nedapu, pegali, tajadu, tusugu (`measurements/seed/families-1to10.txt`)
- **title-table text:** unknown/golamo-46-lume529 (per-stereotype StereotypeFontSize),
  rebena-98-kiba723, vuvave-27-saki879 and xipane-40-dune740 (title creole through the shared
  `buildTextBlock`)
- **Census:** text x/y reach 148/133 rows. Use the b2 census `--families` (after T2) as the
  population, because T2 moves cluster-relative text.

## Task
1. Use the b2 measurements, not b0. Re-run render-diff on the rows above against the b2 mission
   branch: T2 may already have moved them.
2. For each distinct delta pattern, find which text it is: entity name, stereotype, cluster title,
   edge label or note. Then read the Java that places it and our placement. Quote both.
3. Measure first. Separate width-of-text errors (measurer) from anchor errors (placement). Use the
   DeterministicMeasurer only ([[instrument-space-width-zero]]).
4. Produce an artifact per mechanism and the row map, as in T1b.

## Output
1. One artifact block per mechanism.
2. A table `| mechanism | rows (count + list) | origin | fixer write-set |`.
3. A separate list of rows the b2 close already fixed.

## Acceptance
- Given the 16 + 4 named rows, then each is assigned to a mechanism, or marked "fixed at b2", or
  listed as unexplained with what was ruled out.

**Observability:** N/A. **Rollback:** Reversible (no code).
