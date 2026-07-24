# Skin-file loading — architecture decisions (DRAFT)

## D1 — Two skin grammars; reuse the matching existing path for each

The 5 bundled skins are NOT homogeneous (verified by parsing each):
- **`rose`, `debug`, `strictuml`** are `<style>`-block grammar (`root {}`,
  nested `document { header {} }`, `element { Shadowing 4.0 }`) that
  `parseStyleBlock` (`src/core/skinparam.ts`) parses into a `StyleMap`;
  `applyStyleMap` (`src/core/style-map-theme.ts`) merges it onto a
  `Theme`. `skin <name>` (this family) = read embedded file →
  `parseStyleBlock` → `applyStyleMap`.
- **`reddress`, `sonyxperiadev`** are preprocessor+skinparam skins
  (`!ifndef`/`!define`/`!ifdef` + bare `skinparam` lines). These route
  through the existing preprocessor macro engine + `resolveSkinparam`,
  NOT `parseStyleBlock`.

Reuse the path that matches each grammar; build no new parser for
either. The MVP (Batches 1–3) is the `<style>` family only — it closes
every harness fixture; the preprocessor family is Batch 4. Batch 1 must
GUARD against feeding a preprocessor-style skin to `parseStyleBlock`
(detect leading `!`/`skinparam` and route or defer) rather than
silently mis-parsing it (reddress parses to a bogus 1-selector map).

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
diagram type, not state-only. Two halves, split across batches:
- **Resolution (Batch 1):** `Theme` gains a `shadowing` field;
  `applyStyleMap` maps the parsed `Shadowing`/`element {}` selector onto
  it (it does NOT today — verified). Without this, a loaded skin's
  Shadowing is captured but never reaches a renderer.
- **Rendering (Batch 2):** fix the description/class call site
  (`renderer-cluster.ts:110` hardcodes `shadowing: 0`) AND wire the
  state bespoke render path, both reading the resolved `theme.shadowing`.
This matches jar (`EntityImageState`/`InnerStateAutonom`/`Cluster` all
read `getShadowing()` from the same style). No per-diagram-type shadow
plumbing; no fixture-conditional branches.

## D6 — Skin is the BASE cascade layer; skinparam and inline `<style>` win

Upstream precedence: a `skin <name>` file sets the base, then
`skinparam` lines and inline `<style>` blocks override it, then
element-level inline colors win last. Batch 1 must apply the loaded skin
BEFORE (under) the existing skinparam/`<style>` application in the
cascade, not after — otherwise a diagram that sets both `skin rose` and
an explicit `skinparam` would wrongly let rose clobber the user's
skinparam. Verify with a fixture combining `skin rose` + an overriding
`skinparam BackgroundColor`.

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

- **Shadow offset parameterization**: jar's SVG filter uses `dx=dy=4`
  for nimana while the ink reserves `2×shadow`. rose.skin sets Shadowing
  4.0 for `element` but 1.0/2.0/3.0 for other diagram-type selectors, so
  the filter offset very likely SCALES with the resolved value (not
  fixed 4). Confirm the exact relation from jar's `SvgGraphics` shadow
  emitter — the port's `svg-graphics-shadow.ts` currently hardcodes
  `dx=dy=4`/`stdDeviation=2`, which Batch 2 may need to parameterize by
  the resolved shadow value.
- **`element {}` universal selector**: rose's Shadowing 4.0 lives under
  the `element {}` catch-all. Verify the port's cascade resolves
  `element` as "every entity" (like upstream's universal style), not as
  a literal-named selector — this is the selector that carries the
  shadow for state boxes.
- **`document {}`-level styling**: rose restyles the diagram background
  (`document { BackGroundColor white }`) and header/footer. The MVP
  scopes entity colors + shadow; decide whether document-level styling
  is in Batch 3 or a follow-up (it affects the background rect +
  annotations, a wider surface than entity boxes).
- **Scope vs Phase 4i**: mission-guide's Phase 4i (`<style>` + skinparam
  + CSS class names) overlaps the resolution machinery. Decide whether
  this mission is a focused prerequisite slice of 4i or folds into it.
