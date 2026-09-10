# T6 — Re-measure, re-pin, close out

**Agent:** orchestrator · **Depends on:** T5

## Task

1. Re-measure: Σ`weightedScore` against **42511** and the subset against
   **6752**, with percentages; the x/width families before → after; the
   `removed` totals per axis over the corpus and the count of fixtures
   where Y removed anything.
2. Re-pin the five baselines from ONE measurement (the previous mission's
   scratch `repin-activity.ts`, `DESCENT` and the five `*_COMMENT`
   variables; then rewrite `diff-census.json`'s `exitBarFamilies` for this
   mission). **Diff every re-pinned baseline and name every pin that
   ROSE** with its mechanism; for the style census state how many line
   counts moved toward/away from the jar's; for the swimlane census how
   many divider sets moved closer/farther.
3. Sibling suites: the 23 non-activity `tests/oracle/svg-conformance`
   files at `fa578b8a` (worktree with `node_modules`, `test-results`,
   `assets/stdlib` linked; pass the file list explicitly) and at HEAD, JSON
   reporter, compared per file.
4. Gates at HEAD: typecheck, lint, build, full `npm test` (701 files;
   `rm -rf coverage/.tmp` first).
5. `planning/next-missions.md`: resolve `activity-klimt-compress` (the C2
   bullet under `activity-split-connector-float-equality`); file
   `ArrowsTriangle`, the renderer's edge-label width approximation, the
   in-branch vertical spacing gap, and anything T0–T5 filed, each with
   measured weight.
6. Append a Close-out to the brief README: scored exit bar, premises
   measured false, follow-ons; write `.agent-notes/akc-T6.md`.

## Acceptance criteria

- Given the re-measure, then Σ and the subset are stated before → after
- Given each re-pinned baseline, then every risen pin is named with a
  mechanism, or the report states none rose
- Given the sibling suites, then each is reported unmoved with a count
- Given all four gates at HEAD, then all four are green

## Boundaries

**Ask first (halt and journal):** if Σ`weightedScore` did not fall.

## Observability / Rollback

N/A / **Reversible** (baseline JSON and docs only).

## Commit

`test(akc-T6): re-pin the activity baselines and close out`
