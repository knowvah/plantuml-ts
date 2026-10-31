# Batch 2 — json joins the TitledDiagram export tail (D1)

Serial: T2a (core, byte-identical alone) → T2b (json renderer hands over the
raw 1x block; the only task that moves bytes) → T2c (close + re-pin). Each in
its own worktree; T2b branches from the branch AFTER T2a merged.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-core-json-export-tail.md) | `finalizeJsonFragment`: background rect, then `exportTo` when `exportMargin` is set | typescript-pro (opus, effort high), jff-T2a | `src/core/assemble-svg.ts`, `src/core/TextBlockExporter.ts` (only if needed), `tests/unit/core/assemble-svg-json*.test.ts` | B1 close | [x] |
| T2a gate | merge T2a; chain `b2a-eng` vs `b1-eng` = **0 movers** in all 28 engines (stop 5/7) | orchestrator | `$M/b2a*` | T2a | [x] |
| [T2b](T2b-json-renderer-raw-block.md) | json renderer emits the 1x block at origin + `exportMargin` + `scaleSpec`; delete `scale-at-emit.ts` | typescript-pro (opus, effort high), jff-T2b | `src/diagrams/json/{renderer,layout,document-dimensions}.ts`, delete `src/diagrams/json/scale-at-emit.ts`, json unit tests | T2a gate | [x] |
| [T2c](T2c-close-and-repin.md) | close: merge T2b, measure, shrink-only re-pin, journal every mover | orchestrator | per close-procedure | T2b | [x] |

## Interface (T2a → T2b)
```ts
// src/core/assemble-svg.ts — json/yaml/hcl branch of finalizeShellFragment
// Input: the RenderFragment as applyExportedChrome left it.
//   f.exportMargin === undefined  → today's behaviour, byte for byte.
//   f.exportMargin !== undefined  → f.width/f.height = the RAW chromed block
//     (JsonDiagram#calculateDimension extent + chrome, no margin, no +1);
//     f.body at block origin; f.scaleSpec optional; f.dpi NEVER set (D5);
//     f.numbersDeferred true when the body was drawn deferred.
// Output: background rect spliced as the content's first child at the
//   block's size (UgDiagram.java:128-130 addBackcolor wraps the chromed block),
//   then exportTo(f, body) (TextBlockExporter.ts:363): margin shift,
//   factor over (block + margin), canvas trunc(dim + 1) × factor.
```
**Amended 2026-10-30 (jff-T2a, journal row 20):** the back-colour rect is NOT at the raw
block size inside the scaled block. `TextBlockUtils.addBackcolor` draws nothing
(`TextBlockUtils.java:152-174`); `SvgGraphics` paints the rect at (0,0) before the
margin translate (`SvgGraphics.java:176-192,207-212`, `TextBlockExporter.java:169,173`)
and sizes it `format(maxX) × format(maxY)` = the root size (`SvgGraphics.java:810-811,819-821`).
Core splices it AFTER `exportTo`, at the exported canvas; T2b draws no back-colour rect.
Jar-verified (corpus yaml/tadari, yaml/gipoxa; scratch scale 1.5 / scale 2 + title oracles).

No new `RenderFragment` field (stop 7): `exportMargin`, `scaleSpec`,
`numbersDeferred`, `bodyWrapped` already exist (`src/core/dispatcher-types.ts`).

## Rows to watch (fixtures.md "Regression rows")
No-title scale rows must not rise: json/timafu-94-bixe774, yaml/nuzaje-74-kenu009,
`json/scale-factor`, `json/scale-max-width`, `yaml/scale-factor`. Handwritten:
`json/handwritten-nested`, `yaml/handwritten`, `hcl/handwritten`. Titled:
`json/title-caption-both`, `hcl/title-header`, yaml/tadari-70-nare798.
