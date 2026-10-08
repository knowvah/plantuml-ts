# Standard batch close (batches 1, 2, 3)

Agent: orchestrator. `N` = batch label, `prev` = the previous close's
measurement (`b0.json` for batch 1). `$T` = `plans/activity-divergence-drive/tools/` (add1's pin tool), `$M` = `plans/activity-divergence-drive-4/measurements/`.

## Steps

0. **Clean checkout gate (stop 17).** `test -z "$(git status --porcelain)"` and `git stash list` empty before every merge; otherwise restore, journal, then merge.
1. **Merge.** Merge each task branch (`--no-ff`) after `git diff HEAD` on main
   is empty (D11). Resolve a `docs/catalog.md` conflict by `npm run catalog`.
   Remove the worktrees and branches.
2. **Four gates** (README). The harness-parity test (D4) must be green
   (stop 15). Also diff `renderSync` vs `renderFixtureActivity` dims on
   cifafo-49-jazi415 and letare-59-gore448. Collected = on-disk (stop 7). A red test that
   pinned pre-fix behaviour is updated only with a Java quote (push-forward).
3. **Probe + classify + elements** (`scripts/activity-probe-elements.ts`, T0a). `npx tsx scripts/activity-probe.ts --json $M/bN.json`;
   `npx tsx scripts/activity-probe-classify.ts --json $M/bN-classify.json`.
   Diff per-row scores against `prev`: list every riser.
4. **Survey activity** (save the prior file first): `npm run svg:survey --
   activity --out tests/oracle/svg-conformance/parity-activity.json`. Timeouts
   at load ≥ 8: re-survey.
5. **All engines (D7).** `measurements/survey-all.sh $M/bN-eng` (sequential); `python3 $M/engdiff.py <prev-eng> $M/bN-eng`. Survey every other engine into `$M/bN-eng/parity-
   <e>.json`; diff verdicts + `dotEqual` against `prev`'s engine files
   (`b0-eng/` for batch 1). > 30 movers or any conformant loss = stop 14/4.
6. **Journal movers.** One row per activity riser and per non-activity mover,
   with its mechanism. A structural fall with a numeric rise is a reveal. No
   mechanism = stop 4/5.
7. **Re-pin baselines** (copy the four baselines to `/private/tmp/claude-501/add4/pre-bN/` first). `npx tsx scripts/repin-activity-baselines.ts` (and the
   style/text/swimlane siblings as the batch moved them). Diff the JSON before/
   after (memory `repin-script-raises-preexisting-red-pin`): every row that
   ROSE gets its own journal line or the re-pin is reverted.
   **D6:** `python3 $M/census-away.py <pre-dir> $M/<prev>-elements.json $M/bN-elements.json`;
   every AWAY attribute and every ELEMENTS row needs a mechanism; a row that lost
   elements is a fix task (restore the pre-pin baselines until it lands).
8. **Pin.** Every activity fixture whose render is zero-diff against its
   `in.svg` (`[PROMOTION READY]` in the diff-baseline test, or classify's
   `n === 0`): `npx jiti plans/activity-divergence-drive/tools/pin-goldens.mts add4-bN close-bN <slug...>`;
   update the routing/refusal count assertions with a derivation comment. Run
   `activity.golden.ratchet.test.ts` and the diff-baseline test.
9. **Re-cut the cohort (D5).** Un-pinned `baseline` rows with ws ≤ 150 at
   `bN.json` join `fixtures.md` (new rows marked `(bN)`); rows now pinned get
   `final = pinned (<commit>)`. For the b2 close: name each cohort row's
   next mechanism (`--dump`, `--align`, the Java) and the next batch's family.
10. **Dashboard.** `npm run parity:dashboard`; `npm run catalog` if exports
    changed.
11. **Ledger + brief.** Tick the batch in `README.md` and its `overview.md`;
    write the next batch's `overview.md` task table (families from step 9).
12. **Commit.** Full `npm test` again (pins changed), then
    `chore(add4-bN): close batch N — <pins> pinned, Σ <score>`. The body carries
    counts before → after, pins, risers' mechanisms and the non-activity movers.

## Write-set

- `$M/bN.json`, `$M/bN-classify.json`, `$M/bN-eng/`, `decision-journal.md`,
  `fixtures.md`, `README.md`, `batch-N/overview.md`, the next batch's
  `overview.md` + task specs
- `oracle/goldens/svg-activity/**`
- `tests/oracle/svg-conformance/parity-activity.json`
- `docs/parity-report.md`, `docs/catalog.md`

## Acceptance

- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the probe diff vs `prev` and the all-engine diff, then every rise,
  flip and loss has a journal row with a mechanism.
- Given the golden ratchet, then it holds no fixture that is not zero-diff.
- Given `fixtures.md`, then every row the batch touched has a non-empty
  `mechanism`, and every pinned row a `final`.

Observability: N/A (measurement task). Rollback: Reversible (revert the close
commit).
