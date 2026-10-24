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
| [T3a](T3a-diagnose-scale-chrome.md) | map jar vs port scale/chrome order | debugger (sonnet) | `diagnosis/scale-chrome.md` | B2 | [ ] |
| [T3b](T3b-sequence-through-exporter.md) | sequence through core exporter | typescript-pro (sonnet) | per T3a artifact | T3a | [ ] |
| [T3c](T3c-xlink-title-decode.md) | decode `\n` and `<U+XXXX>` in `xlink:title` | typescript-pro (sonnet) | `src/core/svg.ts`, test | T3a (ordering check only) | [ ] |
| close | standard close, all-engine survey (stop 13 expected at T3b) | orchestrator | per close-procedure | T3b, T3c | [ ] |
