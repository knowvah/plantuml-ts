# T2e — re-measure the files rows of the lengthadjust and extension baselines

Agent: `typescript-pro` (sonnet), worktree `ddc-T2e`. Commit:
`test(files): re-pin lengthadjust files rows after the port (T2e)`.
Read [../task-contract.md](../task-contract.md) first. This task edits a
baseline file by exception (the orchestrator reviews the diff at the merge:
every row must FALL).

## Task
1. `oracle/goldens/svg-lengthadjust/authored-baseline.json:212-245` — the
   four `files-{default,glyphs,none,onechar}` rows. Re-measure with the
   lengthadjust harness (`tests/oracle/svg-conformance/render-fixture-lengthadjust.ts`,
   its ratchet test says how rows are measured). Re-pin each row's
   `diffCount`/`weightedScore` only if it fell; a rise is reported, not
   pinned (stop 5). Touch no other row.
2. `tests/fixtures/extensions/files-*.puml` (4 rows, gated by
   `extensions.ratchet.test.ts` with `MIN_EXAMPLES.files = 4`): re-render in
   both modes; confirm each extension still differs from the jar-compatible
   render in extended mode and that jar-compatible mode equals the jar
   oracle (if one exists beside it). Hand back one line per row for the
   `DIVERGENCES.md` Extensions table (the orchestrator edits that file):
   directive · works/ignored · the attribute that changed · and, per D3,
   which rows the audit (`plans/lengthadjust-document-wide/diagnosis/extension-audit.md:79-93`)
   called "ignored" that are now JAR behaviour (`<style> filesDiagram { … }`
   font/colour) rather than extensions.

## Write-set
`oracle/goldens/svg-lengthadjust/authored-baseline.json` (the four files rows
only), `tests/fixtures/extensions/files-*.puml` (only if a fixture must change
to stay a valid extension example; say why).

## Acceptance
- Given the four lengthadjust rows, then each `diffCount` is ≤ before and the hand-back lists before → after; a row at 0 says so.
- Given `npx vitest run tests/oracle/svg-conformance/lengthadjust* tests/oracle/svg-conformance/extensions.ratchet.test.ts --maxWorkers=2 --coverage.enabled=false`, then green.
- Given the hand-back, then it carries the DIVERGENCES rows in the table's column order.

Observability: N/A. Rollback: Reversible.
