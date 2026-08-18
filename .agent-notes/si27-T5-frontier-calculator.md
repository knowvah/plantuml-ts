## Observation: shared coverage/manifest gates unreliable under 7-way concurrent agent load
- **Context**: Running `npm test` (coverage), `npm run manifest`, and `npm run build`
  during batch-1b while 6 other agents (T1/T2/T4/T6/T7/T8) had uncommitted edits in
  the same working tree.
- **Finding**: (1) `npx vitest run --coverage` writes to a single shared
  `coverage/.tmp/coverage-N.json` path with no per-run isolation; concurrent
  coverage runs from other agents caused `ENOENT` crashes mid-report. (2) `npm run
  build`'s dts bundling step (`unplugin-dts`) raced on the shared `dist/` output
  dir, producing transient `ENOENT`/`Internal Error` failures that cleared on
  retry. (3) `npm run manifest --only state,component,usecase` showed ~1300
  "changed" fixtures immediately after T5's own change, which looked like a real
  regression — but 6 other agents had uncommitted edits spanning
  `state-dot-graph.ts`, `state-composite-header.ts`, `state-composite-sizing.ts`,
  `class-*`, `description/renderer*.ts`, etc. (confirmed via `git status`), i.e.
  files the state/component/usecase render pipeline depends on but that are
  outside T5's write-set.
- **Impact**: A raw manifest/coverage/build gate failure during a highly
  concurrent batch is not reliable evidence of your own task's correctness or
  incorrectness. Isolate: back up your own write-set files, temporarily restore
  their pre-task (`git show HEAD:<path>`) content (never `git stash`/`checkout`),
  re-render a representative fixture sample directly via
  `renderFixture` from `scripts/render-manifest.ts`, diff the hashes, then
  restore your own files. If hashes match, the broader manifest noise is
  provably not yours. `vitest run --coverage.reportOnFailure` is needed to get a
  coverage table at all when ANY test in the run set is currently failing
  (foreign or not) — without it vitest silently skips the summary on failure.
- **Confidence**: High (reproduced directly; root-caused via `git status` showing
  the exact foreign files mid-edit, and via a controlled before/after hash
  comparison on 10 fixtures spanning every FrontierCalculator code path).
