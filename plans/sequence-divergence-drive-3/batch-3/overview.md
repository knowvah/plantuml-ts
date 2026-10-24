# Batch 3 — scale/chrome export re-mirror (D7)

The jar composes chrome first, then derives the export scale from the
chromed dimension (`TextBlockExporter.java:159-177` `exportTo`, `:205-209`
`computeScaleFactor`; `UgDiagram.java:123-145` `getExporter`, `addChrome` at
`:128`). Sequence scales its body from the unchromed dimension
(`renderer.ts:331`) and `index.ts` adds chrome at 1x afterwards. T3a is
read-only and writes only its artifact; T3b consumes the artifact's proposed
write-set. T3c is file-disjoint from T3b **provided T3a's proposed write-set
does not include `src/core/svg.ts`**; if it does, order T3c after T3b
(journal the re-ordering). 15 rows (T3b) + 5 rows (T3c).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-diagnose-scale-chrome.md) | map jar vs port scale/chrome order | debugger (sonnet) | `diagnosis/scale-chrome.md` | B2 | [x] |
| [T3b](T3b-sequence-through-exporter.md) | sequence through the ONE core exporter tail (D7 Amendment 1 route ii, user ruling 2026-10-23) | typescript-pro (sonnet) | `core/TextBlockExporter.ts`, `core/assemble-svg*.ts`, `sequence/renderer.ts`, `sequence/renderer-document.ts`, `dispatcher-types.ts` (docs) + tests | T3a | [x] |
| [T3c](T3c-xlink-title-decode.md) | decode `\n` and `<U+XXXX>` in `xlink:title` | typescript-pro (sonnet) | `src/core/svg.ts`, test | T3a (ordering check only) | [x] |
| [T3d](T3d-brace-skinparam-no-warning.md) | `skinparam { }` block entries emit no deprecation banner (T3a A1, gepuce) | typescript-pro (sonnet) | `preprocessor*.ts`, `block-extractor.ts` (Pick), `skinparam-warnings.ts`, `sequence-warnings.ts:38-44`, `sequence/index.ts:47`, `activity-warnings.ts`, `activity/index.ts:53` + tests | T3a | [x] |
| close | standard close, all-engine survey (stop 13 expected at T3b) | orchestrator | per close-procedure | T3b, T3c, T3d | [x] |
