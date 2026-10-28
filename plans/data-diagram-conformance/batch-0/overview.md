# Batch 0 — branch, tooling, files harness, files bucket

Serial: T0a first (branch + tooling + b0 baseline), then T0b and T0c in
parallel (disjoint write-sets; T0c is orchestrator-only because it pins).
The close records the b0 counts row in `fixtures.md`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-and-tooling.md) | branch, brief commit, tooling copied from gdd, `diff-one.mts`, `pin-json-family.mts`, `pin-files.mts`, `repin-files-routing.mts`, b0 gates + chain + d.ts snapshot | orchestrator | `plans/data-diagram-conformance/{measurements,tools}/*`, `.claude/settings.autonomous.json` | — || [x] |
| [T0b](T0b-files-harness.md) | files conformance harness: thin render helper, golden + authored ratchets (empty) | typescript-pro (sonnet), ddc-T0b | `tests/oracle/svg-conformance/{render-fixture-files.ts,files.golden.ratchet.test.ts,files.authored.ratchet.test.ts}`, `oracle/goldens/svg-files/{README.md,ratchet.json,authored-baseline.json}` | T0a || [x] |
| [T0c](T0c-files-bucket.md) | `startfiles` bucket: classify, pin routing/refusal, capture 8, survey | orchestrator | `scripts/classify-corpus.ts`, `tests/visual/data/files.json`, `test-results/dot-cache/files/**`, `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`, `tests/oracle/svg-conformance/parity-files.json` | T0a || [x] |
| close | merge T0b; gates `b0close`; `fixtures.md` b0 row; `parity-files.json` is the T0c survey | orchestrator | per close-procedure | T0b, T0c || [x] |
