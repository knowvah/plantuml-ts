# T0 — baseline and tick 34 (orchestrator)

## Steps
1. `git switch -c fix/graphviz-tracker-consume 9094705aa`. Apart from the untracked brief, the working tree must be
   clean. Commit the brief as `docs(gtc): add the graphviz-tracker-consume mission brief`. Record
   `npm ls @knowvah/dot-engine` (expect 2.4.0, D1).
2. `bash measurements/gates.sh b0` in the background. Collected must equal on-disk. If it is red, stop and
   record the exact failing test names in `decisions.md` as a known baseline (ask the user first).
3. `bash measurements/chain.sh b0-eng` (all engines, load-gated). Re-run any engine with `timeout` rows.
4. Census `b0` for component, usecase, unknown and state:
   `npx tsx scripts/svg-conformance-census.ts <tree> --json measurements/b0-<tree>-census.json`.
5. `bash measurements/rd.sh b0`, then fill the `b0` column of [../fixtures.md](../fixtures.md) and
   write `measurements/b0/rows.json` (contract below).
6. Tick 34 per D2: confirm rubebe's `b0-eng/parity-unknown.json` row is `conformant` with
   `errorPage: true`, and that `oracle/goldens/stock-error-pages.json` lists it with
   `provenance: 'oracle-widths'`. Change `- [ ] 34-…` to `- [x]` and append the dated D2 note.
7. Journal rows: the baseline SLIs (conformant per engine, census Σ, target rows, pin counts) and the 34 tick.
   Commit `chore(gtc-b0): baseline and tick tracker 34`.

## Interface contract (consumed by every close)
`measurements/b0/rows.json`: `[{ tree, slug, item, verdict, errorPage, structural, numeric, layoutEqual }]`
for every row in fixtures.md.

## Acceptance
- Given main at `9094705aa`, when the survey and render-diffs run, then the counts match fixtures.md's
  "plan" column, or each drift is journaled with its cause.
- Given rubebe is conformant with `errorPage: true` on pinned 2.4.0, when T0 closes, then 34 is `[x]` with a
  dated D2 note.
- Given the gates, then all four pass and collected = on-disk (or the red baseline is recorded per step 2).

**Observability:** records the b0 SLIs. **Rollback:** reversible (revert the commit).
