# Batch 1 — edge order, files port, two diagnoses, authored coverage

Six tasks in parallel worktrees off the batch-0 close; write-sets disjoint.
T1c and T1d write no code — their artifacts decide T2a/T2b. The close pins
the conformant json/yaml/hcl rows, every byte-exact files row, and the
authored rows (json-family manifest `clean` / files authored baseline), and
seeds the batch-2 residual list in `fixtures.md`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-edge-order.md) | diagnose, then emit edges in `manageOneNode` post-order (D2) | debugger (opus, effort high), ddc-T1a | `src/diagrams/json/layout.ts`, `src/diagrams/json/json-layout-prep.ts`, `tests/unit/json/layout.test.ts`, `plans/data-diagram-conformance/diagnosis/edge-order.md` | — | [ ] |
| [T1b](T1b-files-port.md) | `FEntry`/`FilesListing`/`FilesDiagram` port over klimt (D3) | typescript-pro (sonnet, effort high), ddc-T1b | `src/diagrams/files/{ast,parser,layout,renderer,index}.ts`, `tests/unit/files/*.test.ts` | T0b | [ ] |
| [T1c](T1c-title-chrome-diagnosis.md) | diagnosis artifact: json/yaml title chrome offset (D6) | debugger (opus, effort high), ddc-T1c | `plans/data-diagram-conformance/diagnosis/title-chrome.md` | — | [ ] |
| [T1d](T1d-highlight-dup-keys-diagnosis.md) | diagnosis artifact: `#highlight` through duplicated keys (D6) | debugger (opus, effort high), ddc-T1d | `plans/data-diagram-conformance/diagnosis/highlight-dup-keys.md` | — | [ ] |
| [T1e](T1e-json-family-authored.md) | json/yaml/hcl authored fixtures + the structural gate's authored root (D7) | typescript-pro (sonnet), ddc-T1e | `tests/fixtures/{json,yaml,hcl}/*`, `tests/oracle/svg-conformance/json-family-structural.ts`, `tests/oracle/svg-conformance/json-family-structural.test.ts` | — | [ ] |
| [T1f](T1f-files-authored.md) | files authored fixtures (D7) | typescript-pro (sonnet), ddc-T1f | `tests/fixtures/files/*` | T0b | [ ] |
| close | merges; gates `b1`; chain vs b0; structural gate + surveys; pins; `fixtures.md` b1 row + residual list | orchestrator | per close-procedure | T1a–T1f | [ ] |
