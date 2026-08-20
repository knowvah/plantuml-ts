# Batch 0 — Capture the corpus; build the render helper (PARALLEL)

Two independent tasks. T0 runs the jar over the classified sequence corpus;
T1 writes the render helper by mirroring its siblings. Write-sets are
disjoint, and T1 deliberately tests against the already-committed
`tests/fixtures/corpus/sequence/A0001_Test.puml` so it does not wait on T0.

**T0 is the long pole** — ~473 jar renders — and it carries this mission's one
intentional baseline mutation: adding fixtures to `dot-cache/` perturbs
`render-manifest`, because `manifest-diff.py:38` reads an added key as a move.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Capture the sequence oracle corpus; re-pin the manifest baseline | typescript-pro (sonnet) | `test-results/dot-cache/sequence/**`, `test-results/render-manifest-baseline.json`, `.agent-notes/g1h-T0.md` | — | [ ] |
| T1 | The render helper + its test | typescript-pro (sonnet) | `tests/oracle/svg-conformance/render-fixture-sequence.ts`, `tests/oracle/svg-conformance/render-fixture-sequence.test.ts`, `.agent-notes/g1h-T1.md` | — | [ ] |
