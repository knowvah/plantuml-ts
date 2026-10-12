# T0b: Smetana re-capture ×5 (D7)

Agent: orchestrator. This is the only task allowed to change cached oracle bytes
(stop 10).

## Context
G0 (2026-07-13) re-captured every graph fixture carrying
`!pragma layout smetana|vizjs` with the pragma stripped, so that the jar shells out to
real graphviz and dumps `svek-N.dot` (DIVERGENCES.md "`!pragma layout
smetana|vizjs` — always laid out with graphviz", Testing consequence). Five
unknown-tree rows predate that and were captured *with* the pragma, so they are
`oracleBlind`. `test-results/dot-cache/` is tracked, so the re-captured bytes are committed.

Rows: `unknown/{vakovo-25-licu237, fakone-16-boro774, japode-92-famo984,
tikiti-02-bagu049, xagomi-49-caki729}`.

## Task (TDD)
1. `scripts/capture-oracle-cache.ts:104` writes `markup` unstripped. Apply
   `stripLayoutPragma` (`scripts/dot-sync-drilldown.ts:46`, which touches smetana/vizjs
   only and leaves elk alone) at that write. First add a failing unit test showing that
   a smetana-pragma markup is captured without the pragma, while an elk markup keeps its
   pragma.
2. Re-capture only the five: `npx jiti scripts/capture-oracle-cache.ts unknown
   --rebuild --only <5 slugs>`. Confirm each directory now has `svek-1.dot`, and that
   `git status` shows changes for only those five.
3. Re-measure: run `render-diff` on each row, survey unknown, then census. Ignoring the
   five, `parity-unknown.json` must have no other verdict change.
4. For each row that is survey-conformant, census 0-diff and `dotEqual: true`:
   - pin it (`pin-goldens.mts --tree unknown cdd8-b0 t0b <slugs>`)
   - bump the routing and refusal counts
   - retire its acceptance (fakone, japode, tikiti, xagomi; vakovo has none)
5. For any of the five that is NOT conformant, mechanise the residual. A dot-engine
   mismatch confirmed by real `dot -Tdot` on its `svek-1.dot` may be signed under D11.2.
   Anything else stays open with its mechanism and an owner.
6. Note: class rows with `ast.layoutEngine === 'smetana'` draw the SmetanaEdge
   shape (cdd6 T3c). Once `in.puml` loses the pragma, these rows take the svek path. That
   is expected. Journal it.

## Write-set
`scripts/capture-oracle-cache.ts`, its test under `tests/unit/scripts/` (or the
existing location of its tests), `test-results/dot-cache/unknown/<5>/**`,
`oracle/goldens/svg-class/unknown/**`, `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`,
`tests/oracle/svg-conformance/{routing-conformance,refusal-coverage}.test.ts` (counts),
`oracle/accepted-divergences.json`, `parity-unknown.json`, `fixtures.md`, journal.

## Read-set
`plans/g0-limitfinder/batch-1/T2-pragma-recapture.md`; `scripts/dot-sync-drilldown.ts:1-60`;
`scripts/capture-oracle-cache.ts:90-130`; memory "recapture-reference-jar-order"
(pass the jar explicitly if the script offers `--jar`; check the jar's
`plantumlVersion` against `oracle/pin.json`).

## Acceptance
- Given the five re-captures, then each has `svek-N.dot` and `oracleBlind` is false.
- Given the capture-script test, then smetana and vizjs lines are stripped and elk lines
  are kept.
- Given the re-measure, then no unknown row outside the five changes verdict.
- Given each conformant row, then it is pinned and its acceptance retired. Given each
  residual, then it has a mechanism and is either in a D11 class or open with an owner.

**Observability:** N/A. **Rollback:** Reversible: revert the commit, which restores
the cache bytes.
