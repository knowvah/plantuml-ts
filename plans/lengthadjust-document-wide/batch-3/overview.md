# Batch 3 — the extension: audit, examples, docs (D10)

One task after the batch-2 close (it needs T1d, T1e and T2f merged), then the
standard close as `b3` (no engine movers expected: conformance runs in the
jar-compatible mode).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-extension-audit-examples-docs.md) | audit which styling directives work in extended json/yaml/hcl/files; pinned examples; DIVERGENCES.md "Extensions"; docs-site page | typescript-pro (sonnet) | `tests/fixtures/extensions/**`, `tests/oracle/svg-conformance/extensions.ratchet.test.ts`, `DIVERGENCES.md`, `docs-site/guide/<page>.md` (+ sidebar entry), `plans/…/diagnosis/extension-audit.md` | B2 | [x] |
| close | merge, gates, chain vs b2, ledger | orchestrator | per close-procedure | T3a | [x] |
