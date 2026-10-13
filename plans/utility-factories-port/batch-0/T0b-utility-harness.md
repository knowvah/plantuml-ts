# T0b: svg-utility oracle harness + pin tooling (D9)

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
Mirror wbs-engine-port T0b file-for-file (`tests/oracle/svg-conformance/render-fixture-wbs.ts`,
`wbs.golden.ratchet.test.ts`, `wbs.diff-baseline.ratchet.test.ts` as they stand on main today,
`oracle/goldens/svg-wbs/README.md`, `plans/wbs-engine-port/measurements/{pin-wbs,repin-wbs-baseline,
repin-wbs-routing}.mts` + `pin-wbs.test.mts` + `vitest.config.mts`), with these differences:
1. The row set is a FIXED list of 17 slugs in `test-results/dot-cache/unknown/` (export it as
   `UTILITY_SLUGS` from `render-fixture-utility.ts`, copied from `../fixtures.md`), not a whole
   cache dir. Every tool reads/writes only those rows; the routing/refusal re-pin touches only
   `tree: dot-cache, type: unknown` rows whose slug is in the list and clones goldens twins as
   `tree: goldens, type: svg-utility`.
2. `renderFixtureUtility(markup, measurer, options?)` is a thin wrapper over production
   `renderSync` with the fixture include/asset stores (copy `render-fixture-wbs.ts`).
3. Diff-baseline seeded from a fresh b0 measurement: rows render our error page or the sentinel
   today; record each row's status honestly (`error` with reason for the sentinel, else numeric
   `baseline`). The shape test pins "manifest rows + ratchet pins = the 17 slugs, disjoint".
4. `repin-utility-routing.mts` also rewrites the refusal `reason`/routing `reason` of a re-pinned
   row (they become `agree` / `ok` once the factories land) and fixes the two wrong record
   reasons on request (`--fix-records`: the HELP rows' "never added" claim — `PSystemBuilder.java:188`
   adds it — and `kubuju-35-neji041`'s state-commands copy-paste) — read both rows first and
   rewrite only those reason strings with the correct mechanism.
5. `pin-utility.test.mts` seeds an EMPTY ratchet on a temp repo.

## Write-set
`tests/oracle/svg-conformance/{render-fixture-utility.ts,utility.golden.ratchet.test.ts,utility.diff-baseline.ratchet.test.ts}`,
`oracle/goldens/svg-utility/**`, `plans/utility-factories-port/measurements/{pin-utility.mts,pin-utility.test.mts,repin-utility-baseline.mts,repin-utility-routing.mts,vitest.config.mts}`,
`.agent-notes/ufp-T0b.md`. Any OTHER file is a stop.

## Interface contract
`renderFixtureUtility(markup: string, measurer: StringMeasurer, options?: { includeStore?, assetStore? }): string`;
`UTILITY_SLUGS: readonly string[]`; `pin-utility.mts <slug>...`;
`repin-utility-routing.mts [--write] [--label <text>] [--fix-records]`;
`repin-utility-baseline.mts [--write] [--accept-rises a,b]`.

## Acceptance
- Given the empty golden ratchet, then it passes with 0 pins (placeholder as wep T0b).
- Given the seeded diff-baseline, then it passes at b0 and a forced in-memory rise fails it.
- Given `pin-utility.mts` on a temp repo, then golden bytes equal the cache bytes and a corrupt
  copy aborts before `ratchet.json` changes.
- Given `repin-utility-routing.mts` dry-run at b0, then it refuses while the rows misroute/error.

**Observability:** N/A. **Rollback:** Reversible (new files).
