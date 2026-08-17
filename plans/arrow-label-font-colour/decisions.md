# Architecture decisions — arrow-label-font-colour

Java paths under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`.
Every decision below was checked against an oracle render (`scripts/oracle-
render.sh`, `-DPLANTUML_DETERMINISTIC_TEXT=true`); the experiments are
reproduced in the table at the bottom — re-render them rather than trust
this file if anything looks off.

## D1 — The colour lives beside its siblings

`theme.colors.graph.arrowFontColor?: string` (resolved hex) next to
`arrowFontSize/Family/Style` (`theme-graph-colors-a.ts:218-236`), and
top-level `theme.cardinalityFontColor?: string` next to
`cardinalityFontSize/Family` (`theme.ts:21-22,255-256,330-331,383-384,476`).
Extends SI24 D3's shape — `deepMergeTheme`, `GRAPH_OVERRIDE_FIELDS`
(`skinparam-theme-builder.ts:85-88`) and `style-map-theme.ts:91-94,143,213`
each already have a slot per field. Rejected: a new `theme.arrowLabel {}`
sub-object (restructures what SI24 built).

## D2 — One resolver, one reader

`resolveArrowLabelFont(theme)` (`src/core/arrow-label-font.ts`) returns
`FontSpec & { color: string }`; new `resolveCardinalityFontColor(theme)`
returns `theme.cardinalityFontColor ?? resolveArrowLabelFont(theme).color`.
`FontSpec` itself is untouched (measurers never see colour). Mirrors
upstream, where `labelFont`/`cardinalityFont` are each ONE
`FontConfiguration` carrying font AND colour (`svek/GraphvizImageBuilder
.java:234-241`; `TextBlockArrow2.java:57-58` reads `getColor()` off the same
object). Rejected: a separate `resolveArrowLabelColor` (two calls per
renderer, two readers of the theme).

## D3 — Default `#000000`, never `theme.colors.text`

Jar's arrow FontColor default is root `FontColor black` (`skin/plantuml
.skin:9`; the `arrow` block at `:306-310` sets no FontColor). The port's
`theme.colors.text` is `#181818` (canvas text) — falling back to it would
move every fixture; that is why `renderer-classifier-rows.ts:45-50` and
`class/renderer-edge.ts:352,360,369` hard-code `#000000` today. State
(`state-renderer-transitions.ts:191`) currently draws `theme.colors.text` —
it moves to the resolver under this mission; T5 must prove zero state
movement (59 pins, full state dump). If `theme.colors.text` was faithful
somewhere (dark theme?), stop 8.

## D4 — Precedence is last-declared-wins, no specificity

`StyleStorage#computeMergedStyle` (`style/StyleStorage.java:102-116`) merges
every matching declaration in registration order with
`OVERWRITE_EXISTING_VALUE`; `DarkString#mergeWith` (`style/DarkString.java
:50-58`) lets the later value win at equal priority. Skinparams convert to
styles the same way (`style/FromSkinparamToStyle.java:149` `addConFont
("arrow", SName.arrow)` → `:424-429` registers `arrowFontColor` as
`PName.FontColor` on `SName.arrow`; `:157` `defaultFontColor` →
`SName.root`). Consequences, all oracle-verified below:

- `<style>`: `resolveStyleCascade(ARROW_SNAMES, 'fontcolor')` already walks
  declarations in source order, last wins (`style-map-element.ts:365-397`)
  — experiments i/k/l/m reproduce unchanged. Prefer `cascadeFontColorHex`
  (`style-cascade-class.ts:144-160`) with `theme.colors.background` so
  `#?dark:light` resolves; `cascadeHex` + journal if the line budget forbids.
- skinparam: an `arrowfontcolor` handler sets `acc.arrowFontColor`; the
  existing `fontcolor`/`defaultfontcolor` handler (`skinparam-key-handlers
  .ts:102`) ALSO sets `acc.arrowFontColor`. Handlers run in source order, so
  `ArrowFontColor green` then `defaultFontColor red` → red (b) and the
  reverse → green (g) fall out with no ordering logic. `classFontColor`
  normalises to `classfontcolor` (`skinparam-key-normalize.ts`), never
  `fontcolor` — it does not touch arrow labels (j).

## D5 — Cardinality inherits arrow

`getStyleArrowCardinality` = `{root,element,<diagram>,arrow,cardinality}`
(`GraphvizImageBuilder.java:124-126`); `plantuml.skin` has no `cardinality`
block, so it inherits `arrow`'s FontColor (a/g/h all colour `1`/`*`/`card`)
until `arrow { cardinality { FontColor } }` overrides (`camuna`, red).
`computeCardinalityFontOverride` (`style-cascade-class.ts:238-250`) gains
`fontcolor` over `CARDINALITY_SNAMES` (already a superset of `ARROW_SNAMES`,
`:29-33`); the resolver's `?? arrowColor` covers the skinparam path.

## D6 — Glyph = font colour

`TextBlockArrow2#drawU` applies `color` and `color.bg()` (`klimt/shape/
TextBlockArrow2.java:66-67`): the magic-arrow `<polygon>` takes the label
colour for BOTH `fill` and `stroke` (jar `gobuco`: `fill="#000"
style="stroke:#000..."`; experiment a: `fill="#F00" stroke:#F00`).
`class/renderer-edge.ts#magicArrowPolygon` (`:216`) takes the colour as a
parameter — one emitter, per SI25 T3.

## D7 — Movement policy

Only the 12 corpus fixtures with an arrow FontColor may move, plus skin
fixtures if `skins-builtin.ts:361`'s `arrowFontColor ARROWFONTCOLOR` starts
applying — each verified against an oracle render, toward jar only.
Everything else byte-identical (full per-engine SVG dump). Stereotyped
`skinparam arrow<<tag>>` (`xenusu`) is verify-then-name (stop 10).
Reversible — one commit per task.

## Oracle experiments (2026-08-17, pinned jar; class unless noted)

| id | source | jar result |
|---|---|---|
| a | `skinparam defaultFontColor red`; `A -> B : lab >`; `A "1" -- "*" B : card` | label, glyph (fill+stroke), `card`, `1`, `*` all `#F00` |
| b | `skinparam ArrowFontColor green` THEN `skinparam defaultFontColor red` | all `#F00` (later wins) |
| g | `defaultFontColor red` THEN `ArrowFontColor green` | all `#008000` |
| h | `ArrowFontColor green` alone | all `#008000` (cardinality inherits) |
| i | `<style> root { FontColor red } arrow { FontColor green }` | `#008000` |
| k | `<style> arrow { FontColor green } root { FontColor red }` | `#F00` (later wins, no specificity) |
| l | `<style> classDiagram { arrow { FontColor green } } arrow { FontColor red }` | `#F00` |
| m | `<style> arrow { FontColor red } classDiagram { arrow { FontColor green } }` | `#008000` |
| j | `skinparam classFontColor red` | `#000` (untouched) |
| d/e | state, `stateDiagram { arrow { FontColor blue } }` / bare `arrow {}` | `#00F` |
| f | component `[A] --> [B] : lab`, `arrow { FontColor blue }` | `#00F` |
| gobuco (corpus) | no override | `#000` text and glyph |
