## Observation: `oracle/goldens/svg-conformance/` and `tests/oracle/svg-conformance/` are two different directories with the same tail
- **Context**: Wiring `parity-dashboard.ts#loadInputs` to read `routing-baseline.json`/`refusal-baseline.json`.
- **Finding**: `routing-baseline.json` and `refusal-baseline.json` live under
  `oracle/goldens/svg-conformance/`, not `tests/oracle/svg-conformance/` — a
  same-named sibling that instead holds `dot-parity.json`, `parity*.json`,
  and (once produced) `census-*.json`. Pointing the loader at the wrong one
  throws `ENOENT` immediately (caught on first real run of this task, not by
  typecheck — both are plain `string` parameters).
- **Impact**: Any future script reading committed baselines under either
  `svg-conformance` directory should double-check which root it means;
  `scripts/parity-dashboard.ts` now names the goldens one
  `GOLDENS_CONFORMANCE_DIR` specifically to keep the two from being confused
  again at a call site.
- **Confidence**: High (reproduced directly; fixed and re-verified).

## Observation: two new D8 "n/a" vocabulary words were needed
- **Context**: Mapping every dashboard cell to D8's fixed `n/a (<reason>)` vocabulary.
- **Finding**: D8's list had no word for "this family has no `diff-baseline.json`
  at all, or no ratchet family exists for this bucket" — added
  `no diff-baseline yet`. The T6 amendment itself had already flagged
  `no data-diagram-type classification` as a new word (item 4) but D8's own
  text wasn't updated to list it; both are wired into
  `scripts/parity-dashboard-matrix.ts` and covered by
  `tests/unit/scripts/parity-dashboard.test.ts`'s AC2 regex.
- **Impact**: Future dashboard columns should extend `decisions.md` D8 with
  their new words at the same time as the code, rather than leaving the word
  discoverable only by reading the generator.
- **Confidence**: High.
