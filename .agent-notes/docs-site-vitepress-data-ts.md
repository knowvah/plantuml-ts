# docs-site / VitePress notes (F3, 2026-07-11)

## Observation: VitePress hijacks `*.data.ts` modules from the library
- **Context**: T5 playground imports `src/index.ts` into the VitePress
  bundle via a Vite alias (decision D2).
- **Finding**: VitePress's built-in data-loader plugin treats ANY
  resolved module id matching `/\.data\.m?(j|t)s($|\?)/` as one of its
  own loader configs and executes it — `src/core/measurer-jar.data.ts`
  and `src/core/measurer-width-table.data.ts` broke `docs:build` with
  "config must export or return an object". Not configurable.
- **Impact**: any future file named `*.data.ts` under `src/` that is
  reachable from `src/index.ts` will break `docs:build`. Workaround
  lives in `docs-site/.vitepress/config.ts` (`libraryDataFileShim`,
  a resolveId/load plugin that re-suffixes those two ids). Adding a new
  `*.data.ts` requires extending the shim's list — or renaming the
  convention away from `.data.ts` (maintainer call, flagged in
  plans/docs-site/decision-journal.md).
- **Confidence**: High (reproduced + fixed during T5).

## Observation: scripts/dot-sync-report.ts sits at the 500-line hook cap
- **Context**: T1 added `--markdown` mode; lizard file-length hook
  (500-line max) blocked writes.
- **Finding**: file is at exactly 500 lines after comment/string-concat
  compaction. There is no per-file suppression; only per-function
  `#lizard forgives`.
- **Impact**: the NEXT addition to this script forces a module split
  (e.g. extract the markdown/report formatting into a sibling script
  file). Budget for that in any task touching it.
- **Confidence**: High.
