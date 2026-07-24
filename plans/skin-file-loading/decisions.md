# Skin-file loading — architecture decisions (DRAFT)

## D1 — Reuse `parseStyleBlock` + `applyStyleMap`; do not build a new parser

The bundled `.skin` files (`rose.skin` etc.) are written in the exact
`<style>`-block grammar (`root {}`, nested `document { header {} }`,
`element { Shadowing 4.0 }`) that `parseStyleBlock`
(`src/core/skinparam.ts`) already parses into a `StyleMap`, and
`applyStyleMap` (`src/core/style-map-theme.ts`) already merges a
`StyleMap` onto a `Theme`. `skin <name>` = read the embedded file →
`parseStyleBlock` → `applyStyleMap`. Building a separate `.skin` parser
would duplicate — and drift from — the live one.

## D2 — Embed skins as browser-safe string constants (no `fs`)

The library runs in the browser: `src/` may not use `fs`/`path`. Embed
the 5 bundled skins (`rose`, `debug`, `reddress`, `sonyxperiadev`,
`strictuml`) as module-level string constants (mirroring how
`themes-builtin.ts` embeds `!theme` overrides), generated from
`~/git/plantuml/src/main/resources/skin/*.skin`. `plantuml.skin` is
already the baked-in root default — do not re-embed it; a `skin <name>`
layers ON TOP of that root.

## D3 — Shadowing is a cross-cutting feature, resolved once for all types

The Shadowing value must resolve through the SAME style cascade for every
diagram type, not state-only. Batch 2 fixes the description/class call
site (`renderer-cluster.ts:110` hardcodes `shadowing: 0`) AND wires the
state render path, both reading the resolved `style.shadowing`. This
matches jar (`EntityImageState`/`InnerStateAutonom`/`Cluster` all read
`getShadowing()` from the same style). No per-diagram-type shadow
plumbing; no fixture-conditional branches.

## D4 — This mission owns closing `nimana-36-veco708`

G8 landed with `nimana-36-veco708` as a tracked size-backlog exception
(bumped 0.090278 → 0.111111, `_doc`-noted) precisely because its
skin-rose shadow ink was unreachable. Batch 3 restores it: once shadow
ink is reserved, the entry returns to ≤ 0.090278 and is
tightened/removed. G8 does not touch it again; this mission does.

## D5 — Shadow rendering must match jar's SVG, id-normalized

`svg-graphics-shadow.ts#buildShadowFilter` already emits jar's exact
filter structure (byte-verified vs nimana's canonical SVG:
`feGaussianBlur stdDeviation=2`, `feColorMatrix … .4`, `feOffset dx=4
dy=4`, `feBlend`). Reuse it (state path emits the equivalent string via
`svgRoot`'s `extraDefs`). The port's own seeded filter id will differ
from jar's hash id — verify id-normalized, and confirm which elements
carry `filter="url(#…)"` (jar: each entity's main outline rect, not
inner header paths).

## Open questions for review

- **Shadow offset parameterization**: jar's SVG filter uses fixed
  `dx=dy=4` while the ink reserves `2×shadow`. For `skin rose`
  (Shadowing 4.0) both are 4-based and consistent. Confirm from jar's
  `SvgGraphics` whether the filter offset scales with the Shadowing
  value for other values (e.g. 2.0, 3.0 seen in `rose.skin`) before
  assuming fixed-4.
- **Scope vs Phase 4i**: mission-guide's Phase 4i (`<style>` + skinparam
  + CSS class names) overlaps the resolution machinery. Decide whether
  this mission is a focused prerequisite slice of 4i or folds into it.
