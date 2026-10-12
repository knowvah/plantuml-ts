# sep (salt-engine-port): orchestrator close-out observations

## Observation: `chain.sh`'s load<8 gate can be starved by a foreign session
- **Context**: the batch-4 close survey chain (`plans/salt-engine-port/measurements/chain.sh b4-eng`).
- **Finding**: the gate polls `vm.loadavg` and waits for `< 8` before each engine. A parallel session in another repo (graphviz/dot-engine builds running `dot -Tsvg` on large test graphs) held the 1-minute load at 24–45 for over an hour, so the chain sat at 8/28 engines with nothing of this repo's running. The threshold is hard-coded (`chain.sh:9`).
- **Impact**: a stalled chain is not a measurement problem of the batch; check `ps -eo pcpu,args | awk '$1>20'` for foreign load before waiting on it. Cutting it and diffing the next close against the last complete chain (plus the agents' whole-corpus hash diffs) is the fallback used at the b4 close (journal row 40).
- **Confidence**: High

## Observation: a committed survey pin can be stale without any gate noticing
- **Context**: T5a's "non-salt movers" check against `tests/oracle/svg-conformance/parity-mindmap.json`.
- **Finding**: that pin still listed `fovule-12-noze408` and `gukofo-85-vira895` as `structural-match` although every survey since mindmap's b0 reported them conformant and their rendered bytes had not changed; no test compares the pinned survey file against a live survey, only the dashboard reads it. Re-pinned from a fresh survey at the b5 wave-1 close.
- **Impact**: diffing a branch's survey against the committed `parity-<type>.json` reports false movers; diff against the last close's `measurements/<bN>-eng/` instead, and re-pin the survey files at every close that touches the engine.
- **Confidence**: High

## Observation: pinning salt goldens needs routing/refusal twin rows after all
- **Context**: `pin-salt.mts` was written (T0b) on the premise that salt has no routing/refusal twin rows to clone.
- **Finding**: `routing-conformance.test.ts` and `refusal-coverage.test.ts` both walk every `oracle/goldens/svg-*/` directory and fail "corpus completeness" for any golden dir without a `tree: goldens` row (mindmap hit the same at its b5 close, journal row 28 there). `repin-salt-routing.mts` now re-measures the `dot-cache/salt` rows in place and clones the goldens rows; run it after every `pin-salt.mts` run.
- **Confidence**: High
