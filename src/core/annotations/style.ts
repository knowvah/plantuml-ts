/**
 * Annotation chrome style resolution.
 *
 * Base values are the `document{}` (+ sibling `mainframe{}`) block of
 * upstream `plantuml.skin`, overlaid with `skinparam` Title/Header/
 * Footer/Caption/Legend keys, then `<style> title|header|footer|
 * caption|legend|mainframe { ... }` selectors (mission G0b decisions.md D6).
 * Layering order: skin defaults < skinparam and `<style>` in DECLARATION
 * order (cdd4-T7b, `style-skinparam-segments.ts`) — the order `buildTheme`
 * applies for every other Theme field. Given a bare skinparam map instead of
 * the block's declarations, every skinparam precedes every `<style>`.
 *
 * `theme` (the resolved base Theme, post named-theme-resolution) is
 * accepted per the T2 interface contract. G2 N48: `theme.colors.background`
 * is now read as the local-paint-background for `#?light:dark[:transparent]`
 * FontColor resolution (item 29, `resolveConditionalColor`) -- every OTHER
 * per-element document-chrome field the T2 contract anticipated is still
 * unwired: the `Theme` type models no such fields (fontFamily/colors.text
 * are the closest analogs but D6 only lists skinparam + style as override
 * sources, not theme). The dark-theme document overrides at
 * `plantuml.skin:561-576` (header/footer FontColor #7, legend BackGroundColor
 * #2, frame LineColor white) are therefore recorded here but NOT wired —
 * flagged for the orchestrator/T9 once dark-mode chrome is in scope.
 *
 * This module is the public entry point (`resolveAnnotationStyles`) and
 * re-exports the shared types/helpers; the resolution logic itself is split
 * across sibling modules, one-way dependent on each other:
 *   `annotation-style-types.ts`     — shared types (no deps)
 *   `annotation-color.ts`           — gray-shorthand / transparent color helpers
 *   `annotation-clockwise.ts`       — Padding/Margin shorthand parsing
 *   `annotation-defaults.ts`        — verbatim plantuml.skin base values
 *   `annotation-skinparam.ts`       — skinparam Title/Header/... overrides
 *   `annotation-style-overrides.ts` — `<style>` selector overrides
 *
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:1-90 (root {},
 *   document {}, mainframe {} — the verbatim base values, `annotation-defaults.ts`)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontParam.java
 *   (HEADER/FOOTER hardcode defaultColor "#888888" — matches plantuml.skin's
 *   `#8` shorthand; TITLE/CAPTION/LEGEND fall back to FontParamConstant.COLOR
 *   "black", i.e. the root default)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:87-176
 *   (authoritative skinparam key list — `addConFont("title"/"header"/
 *   "footer"/"caption"/"legend", ...)` for Font{Size,Style,Color,Name}, plus
 *   title/legend-only `*BorderColor`/`*BackgroundColor`/`*BorderRoundCorner`.
 *   No `mainframe*` entries exist upstream — mainframe has no skinparam keys.)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ClockwiseTopRightBottomLeft.java#read
 *   (Padding/Margin 1/2/3/4-number shorthand — ported in `annotation-clockwise.ts`)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSet.java:122-133
 *   (single-hex-digit gray shorthand `#8` -> `#888888`, `#D` -> `#DDDDDD` —
 *   ported in `annotation-color.ts`)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:263
 *   (`StyleSignatureBasic.of(SName.root, SName.document, SName.mainframe)` —
 *   confirms `mainframe` is a bare, non-diagram-type-scoped `<style>` selector,
 *   same tier as title/caption/header/footer; only `legend` is diagram-type
 *   scoped per decisions.md D7)
 */

import type { Theme } from '../theme.js';
import type { StyleMap } from '../skinparam.js';
import { resolveColorToSvgHex } from '../klimt/color/HColorSet.js';
import { ANNOTATION_ELEMENTS } from './annotation-style-types.js';
import type { AnnotationBoxStyle, AnnotationElement } from './annotation-style-types.js';
import { BASE_DEFAULTS, cloneBoxStyle } from './annotation-defaults.js';
import { applySkinparamOverrides } from './annotation-skinparam.js';
import { applyStyleOverrides } from './annotation-style-overrides.js';
import {
  styleSkinparamSegments,
  type StyleSkinparamSegment,
  type StyleSkinparamSource,
} from '../style-skinparam-segments.js';

// ---------------------------------------------------------------------------
// Public re-exports (interface contract consumed by T4) — kept importable
// from './style.js' so existing call sites need no changes.
// ---------------------------------------------------------------------------

export type { BoxSides, AnnotationBoxStyle, AnnotationElement } from './annotation-style-types.js';
export { expandGrayShorthand } from './annotation-color.js';
export { parseClockwise } from './annotation-clockwise.js';

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Resolve the six annotation-chrome element styles: skin defaults (verbatim
 * `plantuml.skin` values) overlaid with skinparam, then `<style>` overrides
 * (style wins — see module doc for the layering rationale).
 *
 * G2 N48: `theme.colors.background` is now read (item 29's local-paint-
 * background for `#?light:dark[:transparent]` FontColor resolution --
 * every chrome element sits directly on the document canvas). Every other
 * use of `theme` the T2 interface contract anticipated is still unwired
 * (see module doc).
 */
export function resolveAnnotationStyles(
  theme: Theme,
  declarations: ReadonlyMap<string, string> | StyleSkinparamSource,
  styleMap: StyleMap,
): Record<AnnotationElement, AnnotationBoxStyle> {
  const documentBackgroundHex = resolveColorToSvgHex(theme.colors.background);
  const themeStyleMap = toStyleMap(theme.styleOverrides);
  const segments = segmentsOf(declarations, styleMap);
  const result = {} as Record<AnnotationElement, AnnotationBoxStyle>;
  for (const element of ANNOTATION_ELEMENTS) {
    const style = cloneBoxStyle(BASE_DEFAULTS[element]);
    // G2 N51: see `AnnotationBoxStyle#documentBackground`'s own doc comment.
    style.documentBackground = documentBackgroundHex;
    // G2 N46 (near-zero harvest): `skinparam DefaultFontName X` maps to
    // `PName.FontName` at `SName.root` (`FromSkinparamToStyle.java:156`,
    // `addConvert("defaultFontName", PName.FontName, SName.root)`) --
    // root is the common ancestor of every chrome element's OWN style
    // cascade (`StyleSignatureBasic.of(SName.root, SName.document,
    // SName.title)` etc, this module's own doc comment), so a global
    // `DefaultFontName` overrides every element's `ROOT_FONT_FAMILY`
    // default UNLESS that element sets its own more-specific FontName
    // (per-element skinparam/`<style>`, applied AFTER this and so still
    // wins) -- jar-verified `boduli-27-zufa581` (`skinparam DefaultFontName
    // Helvetica` + `Title ...`, title `<text font-family="Helvetica">`).
    // Applied BEFORE the per-element overrides below so a more specific
    // override still wins (root < document < element cascade specificity).
    // The theme's OWN `<style>` declarations (`root { … }` and
    // `document { … }`), run through the SAME selector resolution a user
    // `<style>` block gets -- and BEFORE it, so a user override still wins.
    //
    // Routed through the styleMap rather than seeded from the compiled scalar
    // fields, and that distinction is load-bearing: `theme.fontFamily` and
    // `theme.colors.text` always hold a value, so seeding from them clobbered
    // the skin's own per-element defaults (`header`/`footer` FontColor `#8`)
    // even when no theme was applied at all. Only a theme that actually
    // DECLARED a root block should override them, which is exactly what an
    // absent `styleOverrides` entry expresses.
    if (themeStyleMap !== undefined) {
      applyStyleOverrides(element, style, themeStyleMap, documentBackgroundHex);
    }
    for (const segment of segments) applySegment(element, style, segment, documentBackgroundHex);
    result[element] = style;
  }
  return result;
}

/**
 * cdd4-T7b: the skinparam / `<style>` declarations as ordered runs. A whole
 * `PreprocessorResult` yields its declaration order (`style-skinparam-
 * segments.ts`: a later skinparam beats an earlier `<style>`, as upstream's
 * single style store does); a bare skinparam map is the two-stage order --
 * every skinparam, then `styleMap`.
 */
function segmentsOf(
  declarations: ReadonlyMap<string, string> | StyleSkinparamSource,
  styleMap: StyleMap,
): readonly StyleSkinparamSegment[] {
  if ('styles' in declarations) return styleSkinparamSegments(declarations);
  return [
    { kind: 'skinparam', entries: declarations },
    { kind: 'style', styleMap },
  ];
}

/** One run onto one element's style: skinparams (root `DefaultFontName`
 *  first), or `<style>` selectors. */
function applySegment(
  element: AnnotationElement,
  style: AnnotationBoxStyle,
  segment: StyleSkinparamSegment,
  documentBackgroundHex: string,
): void {
  if (segment.kind === 'style') {
    applyStyleOverrides(element, style, segment.styleMap, documentBackgroundHex);
    return;
  }
  const defaultFontName = segment.entries.get('defaultfontname');
  if (defaultFontName !== undefined) style.fontFamily = defaultFontName.trim();
  applySkinparamOverrides(element, style, segment.entries, documentBackgroundHex);
}

/** `Theme.styleOverrides`'s plain-object form as the `StyleMap` the override
 *  resolver takes. `undefined` in, `undefined` out — themes without a
 *  `document { … }` block cost nothing. */
function toStyleMap(overrides: Record<string, Record<string, string>> | undefined): StyleMap | undefined {
  if (overrides === undefined) return undefined;
  const map: StyleMap = new Map();
  for (const [selector, decls] of Object.entries(overrides)) {
    map.set(selector, new Map(Object.entries(decls)));
  }
  return map;
}
