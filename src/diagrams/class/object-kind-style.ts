/**
 * Style resolution for the three object-diagram entity images --
 * `object` (`EntityImageObject`), `map` (`EntityImageMap`) and `json`
 * (`EntityImageJson`). Each reads ITS OWN style signature
 * `{root, element, objectDiagram, <sname>}` (`getStyleSignature()`, merged
 * with the entity stereotype) for the box and the member rows, and the
 * nested `{..., <sname>, header}` signature for the name row
 * (`getStyleHeader()`); neither involves the `class` SName.
 *
 * Pure functions over the `<sname>` / `<sname>.header` buckets
 * `style-map-element.ts#collectElementStyleBuckets` fills.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageObject.java:93-134
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageMap.java:87-159
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java:241-253 (getUFont)
 */

import type { Theme } from '../../core/theme.js';
import type { FontSpec } from '../../core/measurer.js';
import type { ElementColors } from '../../core/theme.js';

/** The kinds whose entity image owns an `objectDiagram` style signature. */
export type ObjectKind = 'object' | 'map' | 'json';

/** True for `object` / `map` / `json`. */
export function isObjectKind(kind: string): kind is ObjectKind {
  return kind === 'object' || kind === 'map' || kind === 'json';
}

/** A fully resolved font (family + size + bold/italic flags). */
export interface ObjectKindFont {
  readonly family: string;
  readonly size: number;
  readonly bold: boolean;
  readonly italic: boolean;
}

/** Only the header-font properties a `<style>` block actually set. */
export interface HeaderFontOverride {
  readonly family?: string;
  readonly size?: number;
  readonly bold?: boolean;
  readonly italic?: boolean;
}

function bucketOf(theme: Theme, kind: ObjectKind): ElementColors | undefined {
  return theme.colors.elements?.[kind];
}

function fontFlags(style: ElementColors['fontStyle']): { bold: boolean; italic: boolean } {
  return { bold: style?.bold === true, italic: style?.italic === true };
}

/** First stereotype-scoped `FontSize` hit (`withTOBECHANGED(stereotype)`,
 *  `EntityImageObject.java:132-134`): it wins over the plain and header
 *  sizes alike -- jar-verified `object/tenalu-53-meri239`. */
function stereoFontSize(bucket: ElementColors | undefined, tags: readonly string[]): number | undefined {
  const byStereo = bucket?.fontSizeByStereo;
  if (byStereo === undefined) return undefined;
  return tags.map((t) => byStereo[t.toLowerCase()]).find((v) => v !== undefined);
}

/**
 * The font of the member rows / cells: `getStyle().getFontConfiguration(..)`
 * (`EntityImageMap.java:106`, `MethodsOrFieldsArea.java:240`
 * `FontConfiguration.create(skinParam, style, colors)`), i.e. the
 * `<sname>` style's FontName / FontSize / FontStyle over the diagram default.
 */
export function resolveObjectBodyFont(theme: Theme, kind: ObjectKind, tags: readonly string[]): ObjectKindFont {
  const bucket = bucketOf(theme, kind);
  return {
    family: bucket?.fontFamily ?? theme.fontFamily,
    size: stereoFontSize(bucket, tags) ?? bucket?.fontSize ?? theme.fontSize,
    ...fontFlags(bucket?.fontStyle),
  };
}

/**
 * The name row's font overrides: `getStyleHeader().getFontConfiguration(..)`
 * (`EntityImageObject.java:98`). The header signature extends the plain one,
 * so each property is the `header { }` value when set, else the `<sname>`
 * value; a property neither sets is left out (the caller keeps the theme
 * default).
 */
export function resolveHeaderFontOverride(theme: Theme, kind: ObjectKind, tags: readonly string[]): HeaderFontOverride {
  const bucket = bucketOf(theme, kind);
  if (bucket === undefined) return {};
  const size = stereoFontSize(bucket, tags) ?? bucket.headerFontSize ?? bucket.fontSize;
  const family = bucket.headerFontFamily ?? bucket.fontFamily;
  const { bold, italic } = fontFlags(bucket.headerFontStyle ?? bucket.fontStyle);
  return {
    ...(family !== undefined ? { family } : {}),
    ...(size !== undefined ? { size } : {}),
    ...(bold ? { bold } : {}),
    ...(italic ? { italic } : {}),
  };
}

/** The measurer font of the name row: {@link HeaderFontOverride} over the
 *  diagram default. */
export function headerFontSpec(theme: Theme, font: HeaderFontOverride): FontSpec {
  return {
    family: font.family ?? theme.fontFamily,
    size: font.size ?? theme.fontSize,
    ...(font.bold === true ? { weight: 'bold' as const } : {}),
    ...(font.italic === true ? { style: 'italic' as const } : {}),
  };
}
