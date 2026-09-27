# Standard batch close (batches 1, 3, 4, 5)

Agent: orchestrator. `N` = batch number, `prev` = the previous close's
measurement (`b1.json` is the first; batch 0 has its own T0d/T0e). `$T` =
`plans/class-divergence-drive/tools/`, `$M` = `plans/class-divergence-drive-5/measurements/`.

## Steps

1. **Residual round.** Run `npx jiti $T/render-diff.mts <tree/slug...>` on the
   batch's rows. Fix a residual only if its mechanism is stated in
   `diagnosis/` (one commit, gates, tests). If a residual has no mechanism, set
   `final = open -> cdd6`.
2. **Four gates.** Run the full `npm test` (never filtered), `typecheck`, `lint`
   and `build`. If the 1-min load is above ~20, re-run a red `npm test` before
   believing it.
3. **Collected count.** The JSON-reporter collected test-file count must equal
   `find tests -name '*.test.ts' | wc -l` (stop 7).
4. **Survey class and unknown.** Save the prior files first:
   - `npm run svg:survey -- class --out tests/oracle/svg-conformance/parity-class.json`
   - `npm run svg:survey -- unknown --out tests/oracle/svg-conformance/parity-unknown.json`
5. **Census.** `npx jiti scripts/svg-conformance-census.ts class --json
   tests/oracle/svg-conformance/census-class.json`. After T1 it covers the
   unknown-bucket CLASS rows too.
6. **Render-all.** `npx jiti $T/render-all.mts $M/bN.json` over both trees. Its
   CLASS verdict counts must equal the surveys'.
7. **Diff.** Run `npx jiti $T/pin-diff.mts $M/<prev>.json $M/bN.json`, plus a
   `dotEqual` diff of the old vs new parity files.
8. **Journal movers.** One row per riser, `dotEqual` flip or conformant loss,
   stating its mechanism. A structural fall with a numeric rise is a reveal. A
   mover with no mechanism is stop 4/5.
9. **Other engines** (only if the batch touched `src/`). Survey every other engine
   into `/tmp/cdd5-bN-eng/parity-<e>.json` and diff verdicts plus `dotEqual`
   against `$M/b0-8beta1/` (T0d), subtracting movers already journaled. More than
   20 new non-class movers is stop 10.
10. **Pin.** Pin every CLASS fixture that is survey-conformant and census 0-diff
    and not yet in the ratchet:
    `npx jiti $T/pin-goldens.mts --tree <class|unknown> cdd5-bN close-bN <slug...>`.
    Then bump the hard-coded counts in
    `tests/oracle/svg-conformance/{refusal-coverage,routing-conformance}.test.ts`
    by the pin count, with a derivation comment. Run the ratchet, routing and
    refusal tests.
11. **Dashboard.** `npm run parity:dashboard`; `npm run catalog` if exports changed.
12. **Ledger.** Fill `fixtures.md` `mechanism` + `final` for every row the batch
    settles. Tick the batch in `README.md` and its `overview.md`.
13. **Commit.** Run the full `npm test` again (pins changed), then commit
    `chore(cdd5-bN): close batch N — <c>/<s>/<d>`. The body carries counts before →
    after, pins, each riser's one-line mechanism, and the non-class movers.

## Write-set

- `$M/bN.json`, `decision-journal.md`, `fixtures.md`, `README.md`, `batch-N/overview.md`
- `oracle/goldens/svg-class/**`
- `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`
- `tests/oracle/svg-conformance/{parity-class,parity-unknown,census-class}.json`
- the two gate tests' counts
- `docs/parity-report.md`, `docs/catalog.md`
- the residual round's fix files

## Acceptance

- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given pin-diff vs `prev`, then every rise, flip and loss has a journal row with a
  mechanism.
- Given the ratchet, then it holds no fixture that is not survey-conformant AND
  census 0-diff.
- Given `fixtures.md`, then every row the batch settles has a non-empty `final`.

Observability: N/A (measurement task). Rollback: Reversible (revert the close
commit).
