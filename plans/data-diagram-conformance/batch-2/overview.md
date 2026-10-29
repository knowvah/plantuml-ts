# Batch 2 — residuals from batch 1

Spawned from the batch-1 close's residual list (`fixtures.md`) and the two
diagnosis artifacts. T2a/T2b run only if their artifact says
PORT-CONTROLLED (push-forward rule; journal the skip otherwise). T2b and T2d
both touch `src/diagrams/json/`: T2d's write-set is the complement of T2b's
three files; an overlap is stop 1 and collapses them into one agent in a
follow-up batch. T2a touching `src/core/` makes the close run the all-engine
chain (it runs anyway, stop 4).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-title-chrome-fix.md) | title chrome offset fix (if port-controlled) | typescript-pro (sonnet, effort high), ddc-T2a | from `diagnosis/title-chrome.md` (≤ 3 files) + their tests | T1c | [x] |
| [T2b](T2b-highlight-dup-keys-fix.md) | highlight through duplicated keys fix (if port-controlled) | typescript-pro (sonnet), ddc-T2b | `src/diagrams/json/{JsonObject.ts,json-layout-prep.ts,json-renderer-highlight.ts}`, `tests/unit/json/{JsonObject,highlight-dup-keys}.test.ts` | T1d | [x] |
| [T2c](T2c-files-residuals.md) | every files row not byte-exact at the b1 close | typescript-pro (sonnet, effort high), ddc-T2c | `src/diagrams/files/*`, `tests/unit/files/*` | T1b, T1f | [skipped: no files-side residual; empty-diagram is core → T2f/T2g] |
| [T2d](T2d-json-family-residuals.md) | every json/yaml/hcl authored row not clean at the b1 close | typescript-pro (sonnet, effort high), ddc-T2d | `src/diagrams/{json,yaml,hcl}/*` EXCEPT T2b's three files, + tests | T1a, T1e | [x] 5/9; 4 style-engine rows open |
| [T2e](T2e-files-repin.md) | re-measure the lengthadjust files rows and the extension audit's files rows | typescript-pro (sonnet), ddc-T2e | `oracle/goldens/svg-lengthadjust/authored-baseline.json` (files rows only), `tests/fixtures/extensions/` files rows' measurement notes; DIVERGENCES rows handed back | T1b | [x] |
| T2f/T2g (added, journal rows 28/32) | empty-source test applied only in the factory bases that have it (diagnosis `diagnosis/empty-source.md`, then the 7-file core+plugin fix) | debugger (opus, high), ddc-T2f | `src/core/{dispatcher-types,dispatcher}.ts`, `src/index.ts`, json/yaml/hcl/files/dot `index.ts`, `tests/unit/core/empty-source-factory-base.test.ts` | T2d (json/yaml/hcl `index.ts`) | [x] |
| close | merges; gates `b2`; chain vs b1 (and vs b0 if T2a is core); pins; `DIVERGENCES.md` Extensions files rows from T2e's hand-back; `fixtures.md` b2 row | orchestrator | per close-procedure + `DIVERGENCES.md` | T2a–T2e | [x] |
