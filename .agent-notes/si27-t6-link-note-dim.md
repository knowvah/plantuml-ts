## Observation: T6 batch-end gates blocked by concurrent T8 edit, not T6's own change

- **Context**: Running the mandated 4 quality gates + manifest + dot-sync
  after landing T6 (`src/core/svek/image/EntityImageNoteLink.ts`,
  commit `b367fcc9`), in the shared 7-agent working tree for
  `shared-seam-extraction` batch-1a/1b.
- **Finding**: `npm run typecheck`, `npm run build`, and
  `npx jiti scripts/render-manifest.ts` all failed repeatedly (4 separate
  attempts over ~15 minutes) with hard TS parse errors (`TS1005`, `TS1109`,
  `TS1443` "Module declaration names may only use ' or " quoted strings",
  unterminated string/template literal) in `src/core/dispatcher.ts` and
  `src/core/assemble-svg.ts` — both outside T6's write-set, both squarely
  T8's write-set (D2 assemble-svg unification). The specific error line/
  column moved between consecutive checks a few seconds apart (e.g.
  `dispatcher.ts:73:55` -> `dispatcher.ts:101-108` -> `dispatcher.ts:73:48,
  78-99`), which only happens if the file is being actively rewritten on
  disk between reads — confirms a live, in-progress edit, not a stale
  cache or a real defect to fix.
- **Impact**: T6's own scoped verification (full project `typecheck`/`lint`
  clean before T8's dispatcher.ts edits arrived; `npx vitest run
  tests/unit/state tests/unit/class tests/unit/description
  tests/unit/core/svek/image/EntityImageNoteLink.test.ts` — 100% green,
  thousands of tests) is solid, but the BATCH-END manifest/dot-sync/build
  gates cannot be completed by any agent while `dispatcher.ts`/
  `assemble-svg.ts` are mid-edit. Whoever runs the batch-1b close-out gate
  should re-run `npm run typecheck && npm run build &&
  npx jiti scripts/render-manifest.ts --out ... && npx jiti
  scripts/dot-sync-report.ts <type>` AFTER T8 commits, not assume T6's
  in-flight failures were real.
- **Confidence**: High (directly observed via `tsc`/`esbuild` output,
  moving line numbers ruling out a stale-cache explanation).
