# T0c — the `files` corpus bucket (D4)

Agent: orchestrator (no worktree; pins are orchestrator-only). Two commits,
in this order: `test(conformance): pin routing/refusal for the files bucket (T0c)`,
then `test(conformance): capture the files corpus bucket (T0c)`.

## Context
`scripts/classify-corpus.ts:38-56` `START_KEYWORD_MAP` has no `startfiles`,
so the 8 pdiff `@startfiles` sources (dobido-76-nugu008, xeseve-00-tipa730,
tezofo-39-fano197, tadabe-21-dovi548, kibilo-60-fado726, zixuta-02-suzo281,
nixaro-94-pefo622, nojeru-23-tavo641) sit in `test-results/dot-cache/unknown`.
`routing-conformance.test.ts` and `refusal-coverage.test.ts` walk the whole
dot-cache tree and go red on any un-pinned fixture (memory
`new-corpus-tree-trips-two-gates`): pin BEFORE the capture commit (stop 15).
hcl's 3 rows are duplicated in `unknown`; the files rows stay there too.

## Steps
1. `START_KEYWORD_MAP` gains `startfiles: 'files'` (alphabetical position
   irrelevant; keep the map's style). `python3 scripts/populate-corpus.py`
   / `npx jiti scripts/classify-corpus.ts` per its usage → `tests/visual/data/files.json`
   lists exactly the 8 slugs; no other manifest changes (diff them).
2. Capture into a SCRATCH tree first: `npx jiti scripts/capture-oracle-cache.ts files`
   writes `test-results/dot-cache/files/<slug>/{in.puml,in.svg,.done}`. Do
   NOT commit yet.
3. `npx jiti scripts/pin-corpus-tree.ts files --tree test-results/dot-cache/files --ledger $M/t0c-ledger`
   (`--dry` first); every row's reason is a measured verdict (expect
   `known-misroute`/`jar-ok` style rows as the authored row has today). Diff
   both baselines: only new `files` rows added (stop 15). Commit the two
   baseline files + `classify-corpus.ts` + `files.json` (commit 1).
4. Commit `test-results/dot-cache/files/**` (commit 2). `npm test` green
   after each commit.
5. `npm run svg:survey -- files --out tests/oracle/svg-conformance/parity-files.json`
   (9 rows: 8 corpus + the authored `files-directory-tree-with-note` if the
   survey includes authored roots; otherwise 8). Expect every row `diverged`
   (the engine is not a port yet). Commit with the close.

## Write-set
`scripts/classify-corpus.ts`, `tests/visual/data/files.json`,
`test-results/dot-cache/files/**`,
`oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`,
`tests/oracle/svg-conformance/parity-files.json`, `$M/t0c-ledger/`.

## Acceptance
- Given the 8 sources, when classified, then `files.json` has 8 rows and `unknown.json` is unchanged.
- Given commit 1 alone, when `npm test` runs, then routing and refusal gates are green and no row outside `tree: dot-cache, type: files` changed.
- Given commit 2, when `npm test` runs, then still green; `ls test-results/dot-cache/files | wc -l` = 8, each with `.done`.
- Given the survey, then `parity-files.json` has 8 (or 9) rows, 0 errored.

Observability: N/A. Rollback: Reversible (revert both commits).
