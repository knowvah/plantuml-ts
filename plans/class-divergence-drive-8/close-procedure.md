# Standard batch close (batches 1, 2, 3)

Agent: orchestrator. `N` = batch number; `prev` = the previous close's measurement
(`b0.json` for batch 1). `$T` = `plans/class-divergence-drive/tools/`,
`$M` = `plans/class-divergence-drive-8/measurements/`.

## Steps

1. **Merge.** Merge each task branch with `--no-ff`, but only after `git status` on the
   mission checkout is clean (memory: agents write main via Serena). Resolve a
   `docs/catalog.md` conflict by running `npm run catalog`. Remove the worktrees and
   branches.
2. **Residual round.** Run `npx jiti $T/render-diff.mts <tree/slug...>` on the batch's
   rows. Fix a residual only if its mechanism is stated, as one commit with a test.
   Otherwise set its `final`.
3. **Four gates** (README). Collected must equal on-disk (stop 7). A red test that
   pinned pre-fix behaviour is updated only with a Java quote (push-forward). If a
   timeout appears, grep "timed out" first (memory: vitest timeouts under agent load).
4. **Survey class and unknown.** Save the prior files first, then run
   `npm run svg:survey -- class --out tests/oracle/svg-conformance/parity-class.json`,
   and the same for `unknown` into `parity-unknown.json`. From batch 2 on, the survey
   preloads ELK (T2e).
5. **Census.** `npx jiti scripts/svg-conformance-census.ts class --json
   tests/oracle/svg-conformance/census-class.json`.
6. **Render-all.** Run `npx jiti $T/render-all.mts $M/bN.json --tree all`. Its CLASS
   verdicts must equal the surveys'.
7. **Diff.** Run `npx jiti $T/pin-diff.mts $M/<prev>.json $M/bN.json`, plus a `dotEqual`
   diff of the old against the new parity files.
8. **Journal movers.** One row for every riser, `dotEqual` flip and conformant loss,
   each with its mechanism. No mechanism means stop 4 or 5. At each re-pin, also list
   census attributes that moved AWAY from the jar, and any growth in element count
   (memory: census away-from-jar).
9. **All engines (D9).** Survey every other engine into `$M/bN-eng/parity-<e>.json`, and
   diff verdicts and `dotEqual` against the previous close's engine files. Journal
   each mover's mechanism. Latex movers from T1d are expected. More than 60 movers,
   or any conformant loss, means stop 8 or 4.
10. **Pin.** Pin every CLASS fixture that meets all of these:
    - survey-conformant
    - census 0-diff
    - DOT-eligible (`dotEqual: true`, or D12's ELK rule)
    - still CLASS-routed
    - not yet pinned

    Run `npx jiti $T/pin-goldens.mts --tree <class|unknown> cdd8-bN close-bN <slug...>`.
    Bump the hard-coded counts in
    `tests/oracle/svg-conformance/{refusal-coverage,routing-conformance}.test.ts` with a
    derivation comment. Retire the matching `oracle/accepted-divergences.json` entry
    (D8). Run the ratchet, routing, refusal and DOT-parity tests.
11. **Dashboard.** `npm run parity:dashboard`. Run `npm run catalog` if exports changed.
12. **Ledger.** In `fixtures.md`, set `fixed (<commit>)` or `accepted (D11.n)`. Tick the
    batch in `README.md` and in its `overview.md`.
13. **Commit.** Run the full `npm test` again (the pins changed), then commit
    `chore(cdd8-bN): close batch N — <class survey>, ratchet <n>`. The body carries
    counts before → after, pins, risers' mechanisms and non-class movers.

## Write-set

- `$M/bN.json`, `$M/bN-eng/`, `decision-journal.md`, `fixtures.md`, `README.md`,
  `batch-N/overview.md`
- `oracle/goldens/svg-class/**`, `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`,
  `oracle/accepted-divergences.json`
- `tests/oracle/svg-conformance/{parity-class,parity-unknown,census-class}.json`, plus
  the two gate tests' counts
- `docs/parity-report.md`, `docs/catalog.md`, and the residual round's fix files

## Acceptance

- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the close's survey, then every pinned row is conformant and no engine loses
  a conformant row without a journaled mechanism.
