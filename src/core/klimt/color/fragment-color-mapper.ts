/**
 * fragment-color-mapper.ts -- `skinparam monochrome true|reverse` (G2 N61).
 * Moved from `diagrams/class/class-monochrome.ts` (add4-T3d) so the activity
 * engine applies the same whole-fragment mapper without a cross-engine
 * import (`tests/architecture/layering.test.ts` rule 2). Class and activity
 * both draw plain SVG strings, so both use this one post-process.
 *
 * Jar's `TitledDiagram.java#muteColorMapper` swaps in `ColorMapper.MONOCHROME`/
 * `MONOCHROME_REVERSE` (`klimt/color/ColorMapper.java:80-91`) for the ENTIRE
 * diagram's `UGraphic`, so EVERY drawn color -- resolved-hex, raw literal
 * (`badgeFill`'s hardcoded `spot<Kind>` table), stroke, fill, gradient stop --
 * passes through `ColorUtils#getGrayScaleColor`/`getGrayScaleColorReverse`
 * (`klimt/color/ColorUtils.java:67-74`) as the LAST step before a shape is
 * drawn, uniformly, regardless of where the color's own value came from.
 *
 * Class has no such single terminal draw call (`renderer.ts`'s own "class
 * draws plain SVG strings, never `UGraphic`" precedent) -- every renderer
 * file (`class-badge.ts`, `class-namespace-shape.ts`, `renderer-classifier-
 * box.ts`, `renderer-note.ts`, `class-member-creole.ts`, `renderer.ts`
 * itself) independently interpolates its own already-computed color into a
 * template string, and (jar-verified, `pofabe-33-kizo628`'s badge ellipse)
 * some of those colors are raw hex LITERALS that never touch `klimt/color/
 * HColorSet.ts#resolveColorToSvgHex` at all (`class-badge.ts#badgeFill`'s
 * `spot<Kind>` table returns `'#ADD1B2'` etc. directly) -- so threading a
 * `monochrome` parameter through `resolveColorToSvgHex`'s ~16 call sites
 * would MISS those literal-return paths and produce an incorrect, partial
 * feature.
 *
 * Mirrors jar's real "one universal last-step transform" semantics instead
 * of jar's specific mechanism (a per-call `ColorMapper`): a single
 * post-processing pass over the FULLY ASSEMBLED SVG fragment string, run
 * exactly once at `renderClass`'s own single return point (`children.join('')`
 * plus the separately-threaded `canonicalBackground`/hover-CSS strings) --
 * the class-render equivalent of "every color, at the last possible moment,
 * uniformly." No-op (`svg` returned unchanged) when `mode` is `undefined`
 * (the default -- zero risk to every fixture that doesn't set this
 * skinparam).
 */

import { shortenColor } from '../../svg-format.js';
import type { RgbTriple } from './ColorTrieNode.js';
import { rgbToHsluv, hsluvToRgb } from './HUSLColorConverter.js';
import { fromString as colorOrderFromString, getReverse } from './ColorOrder.js';

export type MonochromeMode = 'true' | 'reverse';

/**
 * `ColorUtils.java#getGrayScaleInternal`: `R*299 + G*587 + B*114`, then
 * `getGrayScaleInternalFromRGB`'s own `/ 1000` (Java `int/int` truncating
 * division == `Math.floor` for the non-negative operands every RGB channel
 * always is). `getGrayScaleColorReverse`: `255 - gray`.
 */
function grayscaleChannel(r: number, g: number, b: number, mode: MonochromeMode): number {
  const gray = Math.floor((r * 299 + g * 587 + b * 114) / 1000);
  return mode === 'reverse' ? 255 - gray : gray;
}

const HEX_COLOR_RE = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})?$/;

/** The 3-digit `#RGB` short form rule 2 (`svg-format.ts#shortenColor`) now
 *  emits wherever all three pairs repeat. Both this module's patterns must
 *  see it: a `#FFF` the monochrome pass skips keeps its ORIGINAL color while
 *  its neighbours get inverted, which is a wrong picture rather than a
 *  formatting nit (jar-verified against `bedogi-86-kala547`,
 *  `jecori-24-pona893` -- `skinparam monochrome reverse`). */
const SHORT_HEX_COLOR_RE = /^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/;

/** `#RGB` -> `#RRGGBB`, so the grayscale math below has full channels. */
function expandShortHex(hex: string): string {
  const m = SHORT_HEX_COLOR_RE.exec(hex);
  if (m === null) return hex;
  return `#${m[1]!}${m[1]!}${m[2]!}${m[2]!}${m[3]!}${m[3]!}`;
}

/** Fully-transparent alpha (`resolveColorToSvgHex`'s own `#00000000`
 *  "no paint" convention, `HColorSet.ts`) -- left unchanged in both modes: an
 *  invisible color has no drawn RGB for jar's real `ColorMapper` to ever see
 *  (upstream's "no paint" sentinel bypasses `HColor#getColor(colorMapper)`
 *  entirely, never reaching `ColorUtils`), so grayscaling its incidental
 *  `000000` RGB payload -- which `reverse` mode would otherwise flip to
 *  `FFFFFF`, still invisible but a spurious literal-text mismatch against a
 *  byte-comparing oracle -- would be a self-inflicted, purely-textual diff. */
const FULLY_TRANSPARENT_ALPHA = '00';

/** One mapped colour: `#RRGGBB`/`#RRGGBBAA`/`#RGB` in, the mapped hex out
 *  (anything else unchanged) -- the class stand-in for a `ColorMapper`
 *  (`klimt/color/ColorMapper.java`). */
export type HexColorMapper = (hex: string) => string;

/** Run `f` over the RGB channels of one hex colour, keeping its alpha. Any
 *  other shape (`"none"`, an unresolved token) passes through unchanged --
 *  mirrors `resolveColorToSvgHex`'s own "not recognized -> unchanged"
 *  contract; a fully-transparent colour is left alone (see
 *  {@link FULLY_TRANSPARENT_ALPHA}). */
function mapHexChannels(hex: string, f: (c: RgbTriple) => RgbTriple): string {
  const m = HEX_COLOR_RE.exec(expandShortHex(hex));
  if (m === null) return hex;
  const [, rHex, gHex, bHex, alphaHex] = m as unknown as [string, string, string, string, string | undefined];
  if (alphaHex === FULLY_TRANSPARENT_ALPHA) return hex;
  const out = f({ r: Number.parseInt(rHex, 16), g: Number.parseInt(gHex, 16), b: Number.parseInt(bHex, 16) });
  const ch = (v: number): string => v.toString(16).padStart(2, '0').toUpperCase();
  return `#${ch(out.r)}${ch(out.g)}${ch(out.b)}${alphaHex ?? ''}`;
}

/**
 * Convert one `#RRGGBB`/`#RRGGBBAA` (jar's + `toSvgHex`'s own uppercase
 * convention) hex color through the grayscale transform. Any other shape
 * (`"none"`, a bare token that never resolved) passes through unchanged --
 * mirrors `resolveColorToSvgHex`'s own "not recognized -> unchanged" contract.
 */
export function applyMonochromeHex(hex: string, mode: MonochromeMode): string {
  return mapHexChannels(hex, ({ r, g, b }) => {
    const gray = grayscaleChannel(r, g, b, mode);
    return { r: gray, g: gray, b: gray };
  });
}

/** `ColorUtils#to255` (`ColorUtils.java:169-177`): `(int) (255 * value)`
 *  (truncation), clamped to `[0, 255]`. */
function to255(value: number): number {
  // `(int)` cast: truncation toward zero, and never a JS `-0` (`| 0`).
  const result = (255 * value) | 0;
  if (result < 0) return 0;
  return result > 255 ? 255 : result;
}

/**
 * `ColorUtils#getReversed` (`ColorUtils.java:139-167`), the
 * `ColorMapper.LIGTHNESS_INVERSE` body (`ColorMapper.java:74-79`): HSLuv
 * round trip (channels `/ 256.0`, not 255 -- upstream's), lightness flipped
 * (`l -> 100 - l`, or `+-50` when saturation is in `(40, 60)`).
 */
export function getReversed(color: RgbTriple): RgbTriple {
  const hsluv = rgbToHsluv([color.r / 256.0, color.g / 256.0, color.b / 256.0]);
  const h = hsluv[0]!;
  const s = hsluv[1]!;
  let l = hsluv[2]!;
  if (s > 40 && s < 60) {
    if (l > 50) l -= 50;
    else if (l < 50) l += 50;
  } else {
    l = 100 - l;
  }
  const rgb = hsluvToRgb([h, s, l]);
  return { r: to255(rgb[0]!), g: to255(rgb[1]!), b: to255(rgb[2]!) };
}

/**
 * `TitledDiagram#muteColorMapper` (`TitledDiagram.java:292-313`) minus its
 * first `SkinParam.isDark` arm (unmodeled): `monochrome true|reverse`, else
 * `reversecolor dark` (case-insensitive) -> {@link getReversed}, else a
 * `ColorOrder` name -> `ColorMapper.reverse(order)` (`ColorMapper.java:
 * 93-100`), else `undefined` (upstream's `init`, the identity here).
 */
export function colorMapperOf(theme: {
  readonly monochrome?: MonochromeMode | undefined;
  readonly reverseColor?: string | undefined;
}): HexColorMapper | undefined {
  const { monochrome, reverseColor } = theme;
  if (monochrome !== undefined) return (hex) => applyMonochromeHex(hex, monochrome);
  if (reverseColor === undefined) return undefined;
  if (reverseColor.toLowerCase() === 'dark') return (hex) => mapHexChannels(hex, getReversed);
  const order = colorOrderFromString(reverseColor);
  if (order === undefined) return undefined;
  return (hex) => mapHexChannels(hex, (c) => getReverse(order, c));
}

/** Matches every `fill`/`stroke`/`stop-color` color VALUE this port's class
 *  renderer ever emits, in both syntaxes it uses: the bare SVG attribute
 *  form (`fill="#RRGGBB"`) and the inline `style="..."` CSS-property form
 *  (`style="stroke:#RRGGBB;..."`, `stroke: #RRGGBB !important` in the
 *  `pathHoverColor` `<style>` block, `fragment-color-mapper.test.ts`'s own
 *  "space after colon" case) -- captures the property-name-plus-delimiter
 *  prefix in group 1 (echoed back verbatim) so only the hex VALUE is
 *  rewritten. Scoped to these three property names specifically (not a bare
 *  `#[0-9A-Fa-f]{6,8}` scan) so it can never touch a non-color hex-shaped
 *  substring incidentally present elsewhere in the markup (this port's own
 *  id/class-name conventions -- `ent0001`, `lnk3`, arrow marker ids -- never
 *  collide with this pattern, but scoping to known color properties is the
 *  defensive choice regardless). */
const COLOR_PROPERTY_RE =
  /((?:fill|stroke|stop-color)(?:="|:\s*))#([0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?|[0-9A-Fa-f]{3}(?![0-9A-Fa-f]))/g;

/**
 * The single post-processing choke point: run once, over the WHOLE assembled
 * class-diagram SVG fragment, right before `renderClass` returns it. No
 * mapper (neither `monochrome` nor a recognised `reversecolor`) is a strict
 * no-op -- zero risk to any fixture that doesn't opt in.
 */
export function applyColorMapperToFragment(svg: string, mapper: HexColorMapper | undefined): string {
  if (mapper === undefined) return svg;
  // shortenColor is applied HERE and not in the mapper: this is an emission
  // site (rule 2's domain), whereas the mapper is also called on
  // `resolvedBackground`, a value the renderer then COMPARES. Shortening
  // that one flipped a background-rect decision and changed the root
  // `style="background:"` the jar emits in full 6-digit form.
  return svg.replace(COLOR_PROPERTY_RE, (_full, prefix: string, hex: string) => {
    return `${prefix}${shortenColor(mapper(`#${hex}`))}`;
  });
}

/** {@link applyColorMapperToFragment} for `skinparam monochrome` alone. */
export function applyMonochromeToFragment(svg: string, mode: MonochromeMode | undefined): string {
  return applyColorMapperToFragment(svg, mode === undefined ? undefined : colorMapperOf({ monochrome: mode }));
}
