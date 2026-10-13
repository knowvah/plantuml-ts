# Batch 5: residual drive (written at the batch-4 close) + authored fixtures

The orchestrator writes one task spec per residual family at the batch-4 close
(close-procedure "Batch-4 extras"), in the batch-1 format, with disjoint write-sets. A family
whose mechanism lives in `src/core/` is a stop-10 report that waits for maintainer approval
before it runs (sep T2f/T2g/T5a/T5b/T5c precedent). T5-cov runs in the last wave, after every
`src/diagrams/wbs/**` fix has merged.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T5a](T5a-creole-url-hyperlink.md) | families A+C+D: creole URL via `UrlBuilder`, hyperlink colour/underline from style, `getXlinkTitle` `appendReplacement` throw — 8 rows | typescript-pro (opus) | `src/core/klimt/creole/command/CommandCreoleUrl.ts`, `src/core/url/UrlBuilder.ts`, `src/core/klimt/drawing/svg/{svg-graphics,driver-text-svg}.ts`, `src/core/klimt/font/FontConfigurationBridge.ts` + tests | T4a, **maintainer approval (stop 10)** | [x] |
| [T5b](T5b-legend-style-name.md) | family B: legend merges `root,document,<styleName>,legend` (`EntityImageLegend.java:49-51`) — 2 rows | typescript-pro (opus) | `src/core/annotations/*.ts` (as needed), `src/diagrams/wbs/index.ts` + tests | T4a, **maintainer approval (stop 10)** | [x] |
| [T5-cov](T5-cov-authored-fixtures.md) | authored MIT-clean fixtures + jar oracles for the corpus's thin spots; harness walks `tests/fixtures/wbs/` | typescript-pro (opus) | `tests/fixtures/wbs/**`, salt-style authored manifest `oracle/goldens/svg-wbs/authored-baseline.json`, the wbs harness files, `src/diagrams/wbs/**` (mechanism fixes, except files a parallel task owns) | T4a + the residual tasks | [x] |

Target: D10 (204/204, pins, bozido slot, 0 losses).

Wave 1: T5a ∥ T5b (disjoint write-sets). Wave 2: T5-cov. Family E (painted background + chrome rect order, `SvgGraphics.java:188-191`/`:817-819` vs `TextBlockExporter.ts#finalizeTitledDiagramFragment`) has NO corpus row — probe-only (T4a `background-pink-title`, `gradient-background-title`), already filed by sep-T5a; T5-cov records it, it is not a batch-5 fix.
