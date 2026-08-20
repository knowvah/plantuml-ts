# Batch 1 — The diff-baseline ratchet (serial)

The mission's centrepiece: the gate a future rebuild ratchets against. Byte-
identity cannot gate anything at zero conformant fixtures, so this is a
monotone-improvement bar over recorded per-fixture diff counts, mirroring
`description.diff-baseline.ratchet.test.ts` — which exists because that
mission measured 0 of 22 conformant and could not build a byte-freeze either.

**This batch renegotiates the `npm test` ceiling.** Oracle suites run inside
`npm test`; the suite sits ~3 s under the 60.3 s stop-11 ceiling, and this
task adds one that renders and compares every captured fixture. T2 measures
and records the new ceiling. Trimming coverage to fit the old one is forbidden.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Diff-baseline ratchet; pin the starting counts; set the new wall-clock ceiling | general-purpose (opus) | `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`, `oracle/goldens/svg-sequence/diff-baseline.json`, `plans/sequence-oracle-harness/README.md` (ceiling only), `.agent-notes/g1h-T2.md` | T0, T1 | [x] |
