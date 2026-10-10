# T1e — move jetigu/nuzise to the sequence bucket (D3, orchestrator only)

## Context
Both fixtures are teoz sequence diagrams (`!pragma teoz true`, `Test <- Test`);
the jar's own `in.svg` says `data-diagram-type="SEQUENCE"`. They sit in
`tests/corpus/activity/` because `scripts/populate-corpus.py`'s regex
classifier has no `<-` sequence pattern and `end` matches activity. They are
also listed in `tests/visual/data/unknown.json`. A scan at planning found
exactly three activity-bucket fixtures the jar types differently: these two
and romuru-66-samu329 (CLASS), which stays (user ruling; already conformant).

## Task
1. Grep every reference to both slugs (`oracle/goldens/**`,
   `tests/oracle/svg-conformance/**`, `tests/visual/data/*.json`, `plans/`
   excluded). Record the list in the journal.
2. **Pin first** (memory: new-corpus-tree-trips-two-gates): stage the target
   `test-results/dot-cache/sequence/<slug>/` copies and pin routing/refusal
   for them before the move commit; update the routing/refusal count
   assertions with a derivation comment.
3. Add an explicit slug → type override in `scripts/populate-corpus.py`
   (comment: the jar's `data-diagram-type`, `TextBlockExporter.java:292-294`)
   so a re-populate keeps them in `sequence/`. Do not change the regex
   classifier (it would reclassify unrelated fixtures).
4. Move `tests/corpus/activity/<slug>.puml` and
   `test-results/dot-cache/activity/<slug>/` to `sequence/`. Remove their
   rows from the activity goldens (diff/text/style/swimlane baselines,
   `ratchet.json` / golden dirs if present); do not change any other row.
5. Survey activity and sequence; commit `chore(aepp-T1e): move misfiled teoz
   fixtures to sequence`.

## Write-set
`scripts/populate-corpus.py`, the two corpus files and cache dirs,
`oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`,
`oracle/goldens/svg-activity/*` (their rows only), routing/refusal count
tests, `tests/visual/data/*.json` only if a bucket file must change.

## Acceptance
- Given the move, when the activity and sequence surveys run, then
  jetigu/nuzise appear only in sequence, and activity's corpus/oracle counts
  each fall by 2.
- Given the routing and refusal gates, then green.
- Given every other activity golden row, then unchanged (diff the JSON).

## Observability
N/A.

## Rollback
Reversible (revert the commit; the cache dirs are restorable from the revert).
