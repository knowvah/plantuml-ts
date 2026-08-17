# Batch 2 — `<style>` cascade ∥ the three renderers

All four run in parallel; disjoint write-sets. T3–T5 read only T1's resolver;
T2 lands the `<style>` path the census (T6) scores them against.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | `<style>` cascade: `computeArrowFontOverride` + `computeCardinalityFontOverride` resolve `fontcolor`; `style-map-theme.ts` threads both | `typescript-pro` (sonnet) | `src/core/style-cascade-class.ts`, `src/core/style-map-theme.ts`, `tests/unit/core/style-cascade-class.test.ts`, `tests/unit/style-map-theme.test.ts` | T1 | [ ] |
| T3 | Class renderer: label `<text>`, glyph `<polygon>` (fill+stroke), tail/head from the resolvers | `typescript-pro` (sonnet) | `src/diagrams/class/renderer-edge.ts`, `tests/unit/class/renderer.test.ts` | T1 | [ ] |
| T4 | Description renderer: `arrowLabelFontConfig` colour from the resolver | `typescript-pro` (sonnet) | `src/diagrams/description/renderer-edge.ts`, `tests/unit/description/renderer.test.ts` | T1 | [ ] |
| T5 | State renderer: transition label fill from the resolver (was `theme.colors.text`) | `typescript-pro` (sonnet) | `src/diagrams/state/state-renderer-transitions.ts`, `tests/unit/state/renderer.test.ts` | T1 | [ ] |

**Batch exit:** four gates; DOT EQUAL unchanged ×5; per-engine SVG dumps vs
the start baseline: class moves only in `picija`/`ticuxa`/`camuna`/`nafiki`,
component only in the seven named, usecase only `xozabi`, state and object
byte-identical — each move toward jar (T6 scores fill-by-fill); every ratchet
holds or is re-pinned toward jar with the measurement journalled.
