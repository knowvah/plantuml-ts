# Standard batch close (batches 1–6)

Agent: orchestrator. `N` = batch number, `prev` = the previous close (`b0` for batch 1).
`$M` = `plans/mindmap-engine-port/measurements/`, `$T` = `plans/class-divergence-drive/tools/`.

## Steps

1. **Merge.** `git diff HEAD` empty, then merge each task branch `--no-ff` in dependency
   order. Resolve a `docs/catalog.md` conflict with `npm run catalog`. Remove the worktrees
   and branches.
2. **Formatting.** `npx prettier --check` over every file changed on the branch since its
   base; format and commit (`style(mmp-bN): ...`) anything unformatted.
3. **Four gates** (README). Collected = on-disk (stop 7). A red test that pinned pre-fix
   behaviour is updated only with a Java quote or a jar probe (push-forward).
4. **Survey all engines** into `$M/bN-eng/parity-<e>.json`, waiting for load < 8 before
   each engine (reuse `plans/class-divergence-drive-6/measurements/b3-eng/chain.sh` with
   `M` pointed at `$M/bN-eng`). Copy `parity-mindmap.json` to
   `tests/oracle/svg-conformance/parity-mindmap.json`.
5. **Diff.** Verdict + `dotEqual` diff of every engine against `$M/<prev>-eng/`: copy
   `$M/engdiff.py` into `$M/bN-eng/` and run `python3 $M/bN-eng/engdiff.py <prev>-eng`. Mindmap movers are expected;
   **any non-mindmap mover needs a mechanism (D11, stop 5)**; any conformant loss is stop 4.
6. **Per-row numbers.** `npx jiti $T/render-diff.mts mindmap/<slug>...` on the batch's rows,
   and on every mindmap mover; record structural/numeric in `fixtures.md`.
7. **Journal movers.** One row per riser or loss, with its mechanism. A structural fall with
   a numeric rise is a reveal. No mechanism = stop 4/5/6.
8. **Pin.** Every mindmap fixture that is survey-conformant, render-diff 0/0, routed
   `MINDMAP` and not yet pinned: pin it into `oracle/goldens/svg-mindmap/` through T0b's pin
   path; update `mindmap.diff-baseline.json` rows that fell, from a fresh measurement.
   **b5 only:** the planned routing/refusal re-pin (D7): re-measure, flip the 139
   `MINDMAP -> NONE` rows the gate reports `[FIXED]`, and bump the two gate tests' count
   constants with a derivation comment. Run the ratchet, routing and refusal tests.
9. **Dashboard.** `npm run parity:dashboard`; `npm run catalog` if exports changed.
10. **Ledger.** `fixtures.md`: `fixed (<commit>)` for every row now conformant; residuals get
    a measured mechanism and an owner. Tick the batch in `README.md` and its `overview.md`.
11. **Commit.** Full `npm test` again if pins changed, then
    `chore(mmp-bN): close batch N — <mindmap conformant>/142`. The body carries the counts
    before → after, the pins, risers' mechanisms and any non-mindmap movers.

## Batch-5 extras

- Set the D9 numeric target from the first real measurement; journal it with its derivation.
- Group every non-conformant row into families by mechanism (instrument first — see
  [[measurement-artifacts-outnumber-defects]]); write `batch-6/overview.md` and one task spec
  per family, in the batch-1..5 format, with disjoint write-sets.
- Re-measure `unknown/semutu-45-zeno907` and record its verdict in the cdd6 ledger note.

## Write-set

`$M/**`, `decision-journal.md`, `fixtures.md`, `README.md`, `batch-*/overview.md`, batch-6 specs,
`oracle/goldens/svg-mindmap/**`, `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`
(b5), the two gate tests' counts (b5), `tests/oracle/svg-conformance/parity-mindmap.json`,
`docs/parity-report.md`, `docs/catalog.md`, style-only formatting commits.

## Acceptance

- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the all-engine diff, then every mover has a journal row with a mechanism.
- Given the golden ratchet, then it holds no fixture that is not conformant and 0/0.
- Given `fixtures.md`, then every row the batch touched has a non-empty `final`.

Observability: N/A (measurement task). Rollback: Reversible (revert the close commit).
