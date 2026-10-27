# T8d — error page: locate the refused line by location, not by index (core)

Agent: `typescript-pro` (sonnet), worktree `gep-T8d`. Commit:
`fix(error): match the refused line by its location in the error listing (T8d)`. Journal row 88.

## Diagnosis artifact (stop 16 — core file; Explore agent, row 88)
- **Symptom:** authored `tests/fixtures/gantt/vega-gantt2` (8-line YAML front
  matter before `@startgantt`, an expected error at file line 14 `[foo2]`): the
  jar's page says `line 14` and lists through `[foo2]`; ours says `line 15` and
  lists through `@endgantt`.
- **Mechanism:** `src/core/error/error-diagrams.ts:85-92`: `trace = umlSourceOf(input)`
  is the block-only slice (`src/core/error/UmlSource.ts:30-38`) while
  `refusal.line` is a 0-based DOCUMENT-absolute index (`src/core/parse-refusal.ts:51-52`,
  thrown at `src/index.ts:221-225`); the code indexes the trace by that
  absolute value and clamps (`at = refusal.line < trace.length ? refusal.line : trace.length - 1`).
  Upstream prints the offending line's own absolute location
  (`error/PSystemError.java:239`, `lineLocation.getPosition() + 1`) and lists
  through it.
- **Ruled out:** stripping the header (prints block-relative `line 6`);
  blanking the header (still `line 15`); the parser (its index is right).
  Generic: wbs (`line 3` vs `9`) and mindmap (`6` vs `10`) probes with a
  header show the same clamp.

## Write-set (core, minimal)
`src/core/error/error-diagrams.ts` (find the trace entry whose absolute
location equals `refusal.line`; cut the listing there; fall back to the last
line only when no entry matches — cite `PSystemError.java:239`),
`tests/unit/core/error/<existing error-diagrams test>` (+ a front-matter case:
expected `line 14`, listing ending at `[foo2]`). Nothing else.

## Acceptance
Typecheck/eslint/prettier clean; `npx vitest run tests/unit/core/error tests/unit/gantt tests/oracle/svg-conformance/stock-error* tests/oracle/svg-conformance/emitter.golden.test.ts --maxWorkers=2` green;
vega-gantt2 through the gantt harness: report `compareSvg` diffs before/after
(the remaining diffs must be only the own-version string and `From string`);
the 28-engine stock error pages are unaffected — run `npx vitest run tests/oracle --maxWorkers=2`
and report any red test with its message (a red test outside gantt is a STOP:
report, do not fix).

Observability: N/A. Rollback: Reversible.
