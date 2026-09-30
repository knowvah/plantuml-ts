# Batch 0: setup and instruments

T0a runs first (orchestrator, creates the branch). T0b–T0d then run in parallel worktrees
(`measurements/mkwt.sh T0x`). No source behaviour changes in this batch; it builds the
instruments every later task measures with. Close: gates + b0 survey (all 28 engines into
`measurements/b0-eng/`), no pins (nothing renders yet).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-ledger-b0.md) | branch, ledger seed (142 rows), b0 measurement | orchestrator | `fixtures.md`, `measurements/b0*`, journal | — | [x] |
| [T0b](T0b-oracle-harness.md) | mindmap oracle harness: render helper, golden ratchet, diff-baseline | typescript-pro (sonnet) | `tests/oracle/svg-conformance/render-fixture-mindmap.ts`, `mindmap.golden.ratchet.test.ts`, `mindmap.diff-baseline.ratchet.test.ts`, `oracle/goldens/svg-mindmap/**` | T0a | [x] |
| [T0c](T0c-jar-probes.md) | Java probes against the oracle jar (StyleProbe, LayoutProbe) | typescript-pro (sonnet) | `plans/mindmap-engine-port/tools/probe/**` | T0a | [x] |
| [T0d](T0d-jar-skin-extraction.md) | extract the jar skin(s) verbatim + drift test | typescript-pro (sonnet) | `scripts/extract-jar-skin.ts`, `src/core/style/skins/**`, its test | T0a | [x] |
