# Batch 0 close — gates, ledger dashboard, no re-pin

**Agent:** debugger · **Depends on:** T0, T0b

## Context

Batch 0 makes no code change under `src/` — it only declares the 7 ELK
divergences and builds the tooling every later close reuses. This close
task exists to prove the pipeline end-to-end (gates, survey, census,
`render-all`/`pin-diff`, dashboard) BEFORE batch 1 relies on it, and to
produce `measurements/b0.json` as the fixed point every later batch's
`pin-diff` chains from. No fixture should move; any movement here is a
tooling bug (T0b), not a port fix, and is stop 5 territory if unexplained.

## Steps

1. Four gates: `npm test`, `npm run typecheck`, `npm run lint`, `npm run
   build` — all green.
2. `npm run svg:survey class` — counts must still read 412/50/261 (plus the
   7 now-ledgered ELK slugs remain `diverged`, unchanged verdict).
3. `npx jiti scripts/svg-conformance-census.ts class` — 0-diff count
   unchanged from T0's baseline reading.
4. `npx tsx tools/render-all.mts measurements/b0.json`.
5. `npx tsx tools/pin-diff.mts measurements/base.json measurements/b0.json`
   — expect ZERO transitions, flips, or diff-count deltas (b0 = base per
   `README.md`'s batch table; nothing under `src/` changed this batch). Any
   non-empty output is stop 5 — halt and journal before proceeding.
6. No re-pin this batch (nothing crossed the survey-conformant AND
   census-0-diff bar that wasn't already pinned — confirm ratchet pin count
   is still 314 before and after).
7. `git diff tests/oracle/svg-conformance/parity-class.json` after a fresh
   `npm run svg:survey class` — expect no diff (re-survey is idempotent);
   commit only if the file's `measuredAgainstCommit`-style timestamp field
   changed and nothing else.
8. `npm run parity:dashboard` — commit the regenerated `docs/
   parity-report.md`.
9. `fixtures.md`: fill the `after batch N` column... N/A for batch 0 (that
   column starts at batch 1's close per the table header) — instead, note
   in `decision-journal.md` that the ELK 7 remain `diverged` by design and
   will never gain an `after Bn` value.
10. Tick batch 0's `[ ]` to `[x]` in `README.md`'s batches table.
11. JSON-reporter collected test count == on-disk test file count (stop 7)
    — run `npm test -- --reporter=json` (or the project's equivalent) and
    diff the collected file count against `find tests -name '*.test.ts' |
    wc -l`.
12. Commit.

## Write-set

`docs/parity-report.md`, `plans/class-divergence-drive/measurements/
b0.json`, `plans/class-divergence-drive/decision-journal.md`,
`plans/class-divergence-drive/README.md` (tick only), `.agent-notes/
cdd-close-b0.md`.

## Acceptance criteria

- Given `pin-diff.mts base.json b0.json`, then output is empty (zero
  transitions)
- Given the four gates, then all exit 0
- Given `docs/parity-report.md`, then it is freshly regenerated and its
  class row's ledger section still lists the 7 ELK entries
- Given the JSON-reporter run, then collected count equals on-disk count

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the close commit; no ratchet/pin state changed this
batch, so rollback is a plain revert with no golden-directory cleanup.

## Quality bar

Same four gates as every task, plus the survey/census/pin-diff/dashboard
sequence above must all complete without a `timeout` verdict anywhere
(stop 7) and without an unexplained mover (stop 5).

## Boundaries

Always: treat any non-zero `pin-diff` output as a tooling defect to fix in
T0b before closing, not a fixture to accept. Ask first: nothing — this is
an accounting close, no code under `src/` in scope. Never: touch
`oracle/goldens/svg-class/ratchet.json` this batch (nothing newly
qualifies); rebuild the DOT cache (D12).

## Commit

`chore(cdd-b0): close batch 0 — 412/50/261, 7 ELK declared, tools built`
