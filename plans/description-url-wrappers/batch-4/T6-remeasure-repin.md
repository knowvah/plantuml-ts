# T6 — re-measure, re-pin, D1 check

**Agent:** orchestrator.
**Writes:** the close write-set; `oracle/goldens/svg-description/**` and `ratchet.json`, routing/refusal
baselines (pin twins only), `oracle/goldens/svg-conformance/layout-parity-baseline.json` (additive),
`oracle/goldens/svg-description/diff-baseline.json` (tighten only), `tests/oracle/svg-conformance/parity-*.json`
(trees that moved) and `census-{component,usecase}.json` (rows that fell), `docs/parity-report.md`,
`docs/catalog.md`, and count-pin tests that the new pins move (routing/refusal totals,
`tests/unit/scripts/dot-sync-fixtures.test.ts`) — each with a derivation comment.

## Steps
1. Run the standard close ([../close-procedure.md](../close-procedure.md)) as `b4`, diffing against
   **b0** and the previous close.
2. Re-pin: `npx jiti measurements/pin-description.mts measurements/b4-eng b4` (dry run, then `--write`);
   diff every baseline JSON after writing (only `$comment` lines may change among existing rows; a pin that
   ROSE is stop 6). Add newly layout-equal description-family rows to the layout-parity baseline. Tighten
   the diff-baseline where values fell (`npx jiti measurements/measure-diff-baseline.mts`). Update census
   pins only for rows that fell. Refresh the tracked `parity-<tree>.json` for trees that moved (the
   ratchet's eligibility reads them). Re-run the full gates after re-pinning.
3. D1, clause by clause, journaled: target rows' `<a>`/`@id` diffs (fill the ledger for any non-zero row);
   losses; census rises; class/object/state ratchets.
4. `npm run parity:dashboard`; commit `docs/parity-report.md`.

## Acceptance
- Given the b0 → b4 diff, then every mover in every engine has a journal row with a mechanism; losses = 0.
- Given D1, then each clause is journaled as met, or missed with its gap list.
- Given the gates after re-pin, then all four pass and collected = on-disk.

**Observability:** final SLI record before exit. **Rollback:** Reversible.
