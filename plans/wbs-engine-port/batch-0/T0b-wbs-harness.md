# T0b: wbs oracle harness + pin tooling (D7)

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
Mirror salt-engine-port T0b and its tooling file-for-file, with `salt` → `wbs`, `51` → `204`,
`lakari-33-mone874` → the T0a-classified jar-error rows (read every source named here first):
1. `tests/oracle/svg-conformance/render-fixture-wbs.ts` (`renderFixtureWbs(markup, measurer,
   options?)`): a thin wrapper over production `renderSync` with the fixture include/asset
   stores, copying `render-fixture-salt.ts`.
2. `wbs.diff-baseline.ratchet.test.ts` + `oracle/goldens/svg-wbs/diff-baseline.json`: mirror
   `salt.diff-baseline.ratchet.test.ts` as it stands on main today (its `measure()` and the
   `ERROR_SENTINEL` marker check), seeded from a fresh measurement at b0 — every row
   `status: "error"` (sentinel) today; the jar-error rows carry a `jar-crash:`/`jar-error:`
   reason per T0a's classification; the shape test pins "manifest rows + ratchet pins = the
   204 cached slugs, disjoint" and the count of jar-error reasons.
3. `wbs.golden.ratchet.test.ts` + `oracle/goldens/svg-wbs/ratchet.json` (0 pins; the
   placeholder assertion as salt's T0b); tamper test with a `rect x="([\d.]+)"` regex (salt's
   fix); no DOT eligibility (wbs never dumps `svek-N.dot`).
4. `oracle/goldens/svg-wbs/README.md` (salt's, adapted).
5. `plans/wbs-engine-port/measurements/pin-wbs.mts`, `repin-wbs-baseline.mts`,
   `repin-wbs-routing.mts` — copies of the salt tools with the type substituted; `pin-wbs`'s
   doc points at `repin-wbs-routing` for the twin rows; `pin-wbs.test.mts` seeds an EMPTY
   ratchet (salt's b4 fix) and `measurements/vitest.config.mts` runs it
   (`npx vitest run --config plans/wbs-engine-port/measurements/vitest.config.mts`).
6. Track `tests/oracle/svg-conformance/parity-wbs.json` from `npm run svg:survey -- wbs --out …`.

## Write-set
`tests/oracle/svg-conformance/{render-fixture-wbs.ts,wbs.golden.ratchet.test.ts,wbs.diff-baseline.ratchet.test.ts,parity-wbs.json}`,
`oracle/goldens/svg-wbs/**`, `plans/wbs-engine-port/measurements/{pin-wbs.mts,pin-wbs.test.mts,repin-wbs-baseline.mts,repin-wbs-routing.mts,vitest.config.mts}`,
`.agent-notes/wep-T0b.md`. Any OTHER file is a stop.

## Interface contract (consumed by every close and by T4a/T5-cov)
`renderFixtureWbs(markup: string, measurer: StringMeasurer, options?: { includeStore?, assetStore? }): string`;
`pin-wbs.mts <slug>...`; `repin-wbs-routing.mts [--write] [--label <text>]`; `repin-wbs-baseline.mts [--write] [--accept-rises a,b]`.

## Acceptance
- Given the empty golden ratchet, then the test passes with 0 pins and the tamper case is a
  documented placeholder until a pin exists.
- Given the seeded diff-baseline, then it passes at b0; a forced regression in an in-memory
  double fails it; a real fixture trips the sentinel check today.
- Given `pin-wbs.mts` on a temp repo, then golden bytes equal the cache bytes and a corrupt
  copy aborts before `ratchet.json` changes.
- Given `repin-wbs-routing.mts --write` at b0 (dry-run acceptable in the report), then it
  refuses while the rows still misroute (no ledger excuse) — the refusal is the expected b0 result.

**Observability:** N/A. **Rollback:** Reversible (new files).
