/**
 * theme-graph-colors.ts — the `Theme["colors"]["graph"]` sub-object,
 * extracted from ./theme.ts (which re-declares it as `graph:
 * ThemeGraphColors`) purely to keep theme.ts under the project
 * 500-line file-size cap after the mission skin-file-loading
 * (deferred D3 item) `ElementColors.shadowing` addition — mirrors the
 * existing `svg.ts` -> `svg-markers.ts` / `style-map-theme.ts` ->
 * `style-map-element.ts` split precedent (pure move, no behavior
 * change, no runtime import — this is a type-only declaration).
 */

import type { Paint } from './paint.js';
import type { ThemeGraphColorsA } from './theme-graph-colors-a.js';
import type { ThemeGraphColorsB } from './theme-graph-colors-b.js';

/**
 * Per-element (SName) color overrides — decision D4. Each role may hold a solid
 * color or a gradient {@link Paint}; unset roles cascade to the root/graph
 * default via {@link resolveElementPaint}.
 */
export interface ElementColors {
  background?: Paint;
  border?: Paint;
  font?: Paint;
  /** `<sname>FontSize` skinparam (flat or block form) / `<style> <sname> {
   *  FontSize N }` — G1 I4b. Overrides the entity/cluster TITLE text size
   *  (`FontParam.<SNAME>`'s per-diagram default, `klimt/font/FontParam.java`
   *  — every reachable entry is size 14). */
  fontSize?: number;
  /** `<sname>StereotypeFontSize` skinparam (flat or block form) / `<style>
   *  <sname> { stereotype { FontSize N } } }` — G1 I4b. Overrides the
   *  STEREOTYPE text size for the same element (`FontParam.<SNAME>_STEREOTYPE`
   *  — same 14pt default as the title, jar-verified I2). Falls back to
   *  `fontSize` when absent — mirrors upstream's `StyleSignatureBasic`
   *  hierarchical cascade (a less-specific `[element,<sname>]` style rule
   *  applies to the more-specific `[element,<sname>,stereotype]` query unless
   *  overridden — `FromSkinparamToStyle.java`'s `addConFont`/`addMagic`
   *  register both as SEPARATE style rules, merged by signature specificity).
   *  Not independently jar-verified against a fixture combining both on one
   *  element (no sampled I4 fixture does) — the cascade fallback is the
   *  most defensible reading of the style system's own architecture, not a
   *  guess from nothing. */
  stereotypeFontSize?: number;
  /** `<style> <sname> { header { BackgroundColor/FontColor/FontSize } } }`
   *  -- G3/O4, `EntityImageObject`/`Map`/`Json`'s own `getStyleHeader()`
   *  nested `header` sub-selector (`StyleSignatureBasic.of(root, element,
   *  objectDiagram, <sname>, header)`), scoped to the same three kinds
   *  `stereotypeFontSize` above already narrows to via `ELEMENT_BUCKET_
   *  SNAMES` gating at the parse site (`style-map-element.ts#collect
   *  ElementStyleBuckets`). `headerBackground` draws a SEPARATE half-
   *  rounded rect over ONLY the title/header area
   *  (`renderer-classifier-box.ts#buildHeaderPrimitive`) whenever it
   *  differs from the bare bucket's own `background` -- mirrors jar's own
   *  `headerBackcolor != null && !backcolor.equals(headerBackcolor)` gate
   *  (`EntityImageObject.java:199`). `headerFont`/`headerFontSize` win over
   *  the bare bucket's `font`/`fontSize` for the NAME row text ONLY
   *  (member rows keep the bare bucket's own values) -- jar-verified
   *  `soxufi-98-nita528`. Absent = no header-specific override (the
   *  common case). */
  headerBackground?: Paint;
  headerFont?: Paint;
  headerFontSize?: number;
  /**
   * mission skin-file-loading (deferred D3 item, class+description
   * shadow): `<sname>Shadowing` skinparam (flat `skinparam databaseShadowing
   * true` or block `skinparam actor { Shadowing false }` form -- both funnel
   * through the SAME normalized flat key, `preprocessor.ts`'s skinparam-block
   * collector) -- upstream `FromSkinparamToStyle.java#getShadowingValue`:
   * `false`/`no` -> `0`, `true`/`yes` -> `3`, else the raw numeric value
   * passed through, registered under this element's OWN `SName` bucket
   * (`StyleSignatureBasic.of(root, element, <sname>)`), which wins over the
   * diagram-wide `Theme.shadowing` (bare `root`/`element` selector) when
   * BOTH are set -- mirrors {@link Theme.shadowing}'s own cascade precedent
   * exactly (`resolveElementShadowing`'s own doc comment). Jar-verified
   * `malado-53-noso561`: `skinparam actor { shadowing false }` +
   * `skinparam databaseShadowing true` -- the actor draws NO shadow, the
   * database draws one, though no `<style>`/`skin <name>` root-level
   * Shadowing is set at all. Absent = no per-element override (falls
   * through to {@link Theme.shadowing}).
   */
  shadowing?: number;
  /**
   * `<style> <sname> { LineThickness N } }` -- the per-element border/line
   * thickness, registered under this element's own `SName` bucket
   * (`StyleSignatureBasic.of(root, element, <diagramType>, <sname>)`), which
   * wins over the renderer's built-in default (`ENTITY_STROKE_WIDTH` 0.5 for
   * description leaves) when set. `skin rose`'s `componentDiagram { node,
   * rectangle { LineThickness 1.5 } }` is the first consumer -- a deployment
   * node/rectangle draws a 1.5-wide border, not the 0.5 default. Absent = no
   * per-element override (the renderer's default thickness stands).
   */
  lineThickness?: number;
  /**
   * `<style> <sname> { MinimumWidth N } }` -- the per-element content-width
   * floor, registered under this element's own `SName` bucket
   * (`StyleSignatureBasic.of(root, element, <sname>)`, `PName.MinimumWidth`),
   * which wins over the diagram-wide `Theme.minimumWidth` (bare
   * `skinparam minClassWidth`) when set (S1L-b T5, ADR-3). `zotiru-33`'s
   * `<style> package { MinimumWidth 300 }` floors package boxes' content at
   * 300 while leaving a sibling `card` unfloored. Absent = no per-element
   * override (falls through to {@link Theme.minimumWidth}, then the box
   * default). See `resolveElementMinimumWidth`.
   */
  minimumWidth?: number;
}

export type ThemeGraphColors = ThemeGraphColorsA & ThemeGraphColorsB;
