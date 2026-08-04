/**
 * Table-driven dispatch for normalized (non stereotype-qualified) skinparam
 * keys — the body of upstream SkinParam.java's key switch.
 *
 * Split out of skinparam.ts to keep that file under the project's 500-line
 * file-size cap — see skinparam.ts's own doc comment for the full module
 * map. Every entry below is a 1:1, behavior-preserving port of the
 * corresponding `case` arm from the original inline switch; a switch on
 * string equality has no order-dependence between distinct case labels, so
 * collecting them into a `Map` is safe regardless of table order.
 */

import { parseColor } from './paint.js';
import { ActorStyle } from './skin/ActorStyle.js';
import type { SkinparamAccumulator } from './skinparam-accumulator.js';
import {
  matchElementColorKey,
  matchElementFontSizeKey,
  matchElementShadowingKey,
  matchStereotypeSpotColorKey,
  parseShadowingValue,
} from './skinparam-element-buckets.js';
import { resolveColor } from './skinparam-key-normalize.js';

type KeyHandler = (
  acc: SkinparamAccumulator,
  value: string,
  color: string,
) => void;

// ---------------------------------------------------------------------------
// Shared numeric/string parse helpers — each dedupes an identical parse
// pattern that appears at multiple original case sites (verified byte-
// identical against the pre-split switch before extraction).
// ---------------------------------------------------------------------------

/** `Number(value)` with an `isFinite` guard (classAttributeFontSize et al). */
function parseFiniteNumber(value: string): number | undefined {
  const v = Number(value);
  return Number.isFinite(v) ? v : undefined;
}

/** `Number.parseFloat(value.trim())` with an `isFinite` guard. */
function parseFiniteFloat(value: string): number | undefined {
  const v = Number.parseFloat(value.trim());
  return Number.isFinite(v) ? v : undefined;
}

/** `Number.parseInt(value.trim(), 10)` with an `isFinite` guard, no zero-reject. */
function parseFiniteInt(value: string): number | undefined {
  const v = Number.parseInt(value.trim(), 10);
  return Number.isFinite(v) ? v : undefined;
}

/** Same as {@link parseFiniteInt} but treats 0 as "unset" (nodesep/ranksep/wrapwidth). */
function parseNonZeroInt(value: string): number | undefined {
  const v = Number.parseInt(value.trim(), 10);
  return Number.isFinite(v) && v !== 0 ? v : undefined;
}

/**
 * `SkinParam#getFontFace`'s real substring-match rule -- "bold"/"italic" may
 * both appear (e.g. "bold italic"), matched independently, case-
 * insensitively, anywhere in the value.
 */
function parseFontStyleFlags(value: string): { bold: boolean; italic: boolean } {
  const lower = value.trim().toLowerCase();
  return { bold: lower.includes('bold'), italic: lower.includes('italic') };
}

/**
 * `Guillemet.fromDescription` (java): "false"/"<< >>" -> the literal << >>
 * pair; "none" -> both empty; any OTHER value containing a space ->
 * tokenize into (start, end); anything else (including a garbage spaceless
 * value) falls through to the default GUILLEMET wrapper, left unset here.
 */
function applyGuillemet(acc: SkinparamAccumulator, value: string): void {
  const raw = value.trim();
  const lower = raw.toLowerCase();
  if (lower === 'false' || lower === '<< >>') {
    acc.guillemetStart = '<<';
    acc.guillemetEnd = '>>';
  } else if (lower === 'none') {
    acc.guillemetStart = '';
    acc.guillemetEnd = '';
  } else if (raw.includes(' ')) {
    const tokens = raw.split(/\s+/).filter((t) => t !== '');
    if (tokens.length >= 2) {
      acc.guillemetStart = tokens[0];
      acc.guillemetEnd = tokens[1];
    }
  }
}

// ---------------------------------------------------------------------------
// Key → handler table
// ---------------------------------------------------------------------------

const KEY_HANDLERS: ReadonlyArray<readonly [keys: readonly string[], handler: KeyHandler]> = [
  [['backgroundcolor'], (acc, _v, color) => { acc.background = color; }],
  [['bordercolor'], (acc, _v, color) => { acc.border = color; }],
  [['fontcolor', 'defaultfontcolor'], (acc, _v, color) => { acc.text = color; }],
  [['arrowcolor', 'defaultarrowcolor'], (acc, _v, color) => { acc.arrow = color; }],
  [['notebackgroundcolor'], (acc, _v, color) => { acc.noteBackground = color; }],
  [['pathhovercolor'], (acc, _v, color) => { acc.pathHoverColor = color; }],
  [['diagrambordercolor'], (acc, _v, color) => { acc.diagramBorderColor = color; }],
  [['iconprivatecolor'], (acc, _v, color) => { acc.iconPrivateColor = color; }],
  [['iconprivatebackgroundcolor'], (acc, _v, color) => { acc.iconPrivateBackgroundColor = color; }],
  [['iconpackagecolor'], (acc, _v, color) => { acc.iconPackageColor = color; }],
  [['iconpackagebackgroundcolor'], (acc, _v, color) => { acc.iconPackageBackgroundColor = color; }],
  [['iconprotectedcolor'], (acc, _v, color) => { acc.iconProtectedColor = color; }],
  [['iconprotectedbackgroundcolor'], (acc, _v, color) => { acc.iconProtectedBackgroundColor = color; }],
  [['iconpubliccolor'], (acc, _v, color) => { acc.iconPublicColor = color; }],
  [['iconpublicbackgroundcolor'], (acc, _v, color) => { acc.iconPublicBackgroundColor = color; }],
  // not colors — raw values
  [['fontname', 'defaultfontname'], (acc, value) => { acc.fontFamily = value; }],
  [['fontsize', 'defaultfontsize'], (acc, value) => { acc.fontSize = Number(value); }],
  [['linetype'], (acc, value) => {
    const v = value.trim().toLowerCase();
    if (v === 'ortho' || v === 'polyline') acc.linetype = v;
  }],
  [['nodesep'], (acc, value) => {
    const v = parseNonZeroInt(value);
    if (v !== undefined) acc.nodeSep = v;
  }],
  [['ranksep'], (acc, value) => {
    const v = parseNonZeroInt(value);
    if (v !== undefined) acc.rankSep = v;
  }],
  [['wrapwidth'], (acc, value) => {
    const v = parseNonZeroInt(value);
    if (v !== undefined) acc.wrapWidth = v;
  }],
  [['sameclasswidth'], (acc, value) => {
    // A2s B7: `SkinParam#sameClassWidth()` (SkinParam.java:994) — boolean
    // valueOf; only an explicit true/false is meaningful.
    if (value === 'true') acc.sameClassWidth = true;
    else if (value === 'false') acc.sameClassWidth = false;
  }],
  [['classattributeiconsize'], (acc, value) => {
    // A2s F-G A13: `SkinParam#classAttributeIconSize()` --
    // `getAsInt("classAttributeIconSize", 10)` (SkinParam.java:554-556).
    // 0 IS meaningful (icons off, `MethodsOrFieldsArea#hasSmallIcon`
    // java:125-127), so the zero-rejecting parser is wrong here --
    // parseFiniteInt, mirroring tabsize's own no-zero-is-unset precedent.
    const v = parseFiniteInt(value);
    if (v !== undefined) acc.classAttributeIconSize = v;
  }],
  [['groupinheritance'], (acc, value) => {
    // A2s A10/B3: `DotData.java:136-151` — values <= 1 mean "never group",
    // handled by the consumer; store the parsed int as-is.
    const v = parseNonZeroInt(value);
    if (v !== undefined) acc.groupInheritance = v;
  }],
  [['minclasswidth'], (acc, value) => {
    // S1L-g: `SkinParam` maps `minClassWidth` to `PName.MinimumWidth`, the
    // leaf-box content-width floor. Zero-is-unset (0 == no floor == default).
    const v = parseNonZeroInt(value);
    if (v !== undefined) acc.minimumWidth = v;
  }],
  [['tabsize'], (acc, value) => {
    // G3/O4: `SkinParam#getTabSize()` -- `getAsInt("tabsize", 8)`, no
    // zero-is-unset convention (unlike nodesep/ranksep/wrapwidth) -- this
    // parse site stores the raw configured value verbatim.
    const v = parseFiniteInt(value);
    if (v !== undefined) acc.tabSize = v;
  }],
  [['roundcorner'], (acc, value) => {
    // G2 N65 item 47: unlike nodesep/ranksep/wrapwidth (which treat 0 as
    // "unset"), RoundCorner 0 is a REAL, meaningful jar value (sharp
    // corners) -- only NaN is rejected.
    const v = parseFiniteInt(value);
    if (v !== undefined) acc.roundCorner = v;
  }],
  [['componentstyle'], (acc, value) => {
    const v = value.trim().toLowerCase();
    if (v === 'uml2' || v === 'uml1' || v === 'rectangle') acc.componentStyle = v;
  }],
  // SkinParam.java:1209-1218 `actorStyle()`: case-insensitive
  // `"awesome"`/`"hollow"`, else STICKMAN (verbatim -- an unrecognized value
  // falls through to STICKMAN, it is not rejected/unknown).
  [['actorstyle'], (acc, value) => {
    const v = value.trim().toLowerCase();
    if (v === 'awesome') acc.actorStyle = ActorStyle.AWESOME;
    else if (v === 'hollow') acc.actorStyle = ActorStyle.HOLLOW;
    else acc.actorStyle = ActorStyle.STICKMAN;
  }],
  [['packagestyle'], (acc, value) => {
    const v = value.trim().toLowerCase();
    if (v === 'rect' || v === 'rectangle') acc.packageStyle = 'rect';
  }],
  [['style'], (acc, value) => {
    if (value.trim().toLowerCase() === 'strictuml') acc.strictUml = true;
  }],
  [['monochrome'], (acc, value) => {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === 'reverse') acc.monochrome = v;
  }],
  [['fixcirclelabeloverlapping'], (acc, value) => {
    acc.fixCircleLabelOverlapping = value.trim().toLowerCase() === 'true';
  }],
  [['shadowing'], (acc, value) => {
    const parsed = parseShadowingValue(value);
    if (parsed !== undefined) acc.shadowing = parsed;
  }],
  [['classbackgroundcolor'], (acc, _v, color) => { acc.classBackground = color; }],
  [['classbordercolor'], (acc, _v, color) => { acc.classBorder = color; }],
  [['classborderthickness'], (acc, value) => {
    const v = parseFiniteFloat(value);
    if (v !== undefined) acc.classBorderThickness = v;
  }],
  [['arrowthickness'], (acc, value) => {
    const v = parseFiniteFloat(value);
    if (v !== undefined) acc.arrowThickness = v;
  }],
  [['interfacebackgroundcolor'], (acc, _v, color) => { acc.interfaceBackground = color; }],
  [['enumbackgroundcolor'], (acc, _v, color) => { acc.enumBackground = color; }],
  [['actorbordercolor'], (acc, _v, color) => { acc.actorStroke = color; }],
  [['packagebackgroundcolor'], (acc, _v, color) => { acc.packageBackground = color; }],
  [['packagebordercolor'], (acc, _v, color) => { acc.packageBorder = color; }],
  [['packageborderthickness'], (acc, value) => {
    const v = parseFiniteFloat(value);
    if (v !== undefined) acc.packageBorderThickness = v;
  }],
  [['classattributefontsize'], (acc, value) => {
    const v = parseFiniteNumber(value);
    if (v !== undefined) acc.classAttributeFontSize = v;
  }],
  [['classattributefontname'], (acc, value) => { acc.classAttributeFontFamily = value; }],
  [['classattributefontstyle'], (acc, value) => {
    const flags = parseFontStyleFlags(value);
    acc.classAttributeFontBold = flags.bold;
    acc.classAttributeFontItalic = flags.italic;
  }],
  [['classfontsize'], (acc, value) => {
    const v = parseFiniteNumber(value);
    if (v !== undefined) acc.classFontSize = v;
  }],
  [['classfontname'], (acc, value) => { acc.classFontFamily = value; }],
  [['classfontstyle'], (acc, value) => {
    const flags = parseFontStyleFlags(value);
    acc.classFontBold = flags.bold;
    acc.classFontItalic = flags.italic;
  }],
  [['classstereotypefontsize'], (acc, value) => {
    const v = parseFiniteNumber(value);
    if (v !== undefined) acc.classStereotypeFontSize = v;
  }],
  [['classstereotypefontname'], (acc, value) => { acc.classStereotypeFontFamily = value; }],
  [['classstereotypefontstyle'], (acc, value) => {
    const flags = parseFontStyleFlags(value);
    acc.classStereotypeFontBold = flags.bold;
    acc.classStereotypeFontItalic = flags.italic;
  }],
  [['circledcharacterfontsize'], (acc, value) => {
    const v = parseFiniteNumber(value);
    if (v !== undefined) acc.circledCharacterFontSize = v;
  }],
  [['circledcharacterradius'], (acc, value) => {
    const v = parseFiniteNumber(value);
    if (v !== undefined) acc.circledCharacterRadius = v;
  }],
  [['circledcharacterfontname'], (acc, value) => { acc.circledCharacterFontFamily = value; }],
  [['circledcharacterfontstyle'], (acc, value) => {
    const flags = parseFontStyleFlags(value);
    acc.circledCharacterFontBold = flags.bold;
    acc.circledCharacterFontItalic = flags.italic;
  }],
  [['guillemet'], (acc, value) => applyGuillemet(acc, value)],
  [['activitybackgroundcolor'], (acc, _v, color) => { acc.activityBackground = color; }],
  [['activitybordercolor'], (acc, _v, color) => { acc.activityBorder = color; }],
  [['activitybarcolor'], (acc, _v, color) => { acc.activityBarColor = color; }],
  [['activitydiamondbackgroundcolor'], (acc, _v, color) => { acc.activityDiamondBackground = color; }],
  [['activitydiamondforegroundcolor', 'activitydiamondbordercolor'], (acc, _v, color) => { acc.activityDiamondBorder = color; }],
  [['activitystartcolor'], (acc, _v, color) => { acc.activityStartColor = color; }],
  [['activityendcolor'], (acc, _v, color) => { acc.activityEndColor = color; }],
  [['swimlanebordercolor', 'swimlaneheaderbackgroundcolor'], (acc, _v, color) => { acc.swimlaneBorder = color; }],
];

const KEY_HANDLER_MAP: ReadonlyMap<string, KeyHandler> = new Map(
  KEY_HANDLERS.flatMap(([keys, handler]) => keys.map((k) => [k, handler] as const)),
);

/**
 * Element-scoped color (e.g. `databaseBackgroundColor`) → per-element
 * bucket via parseColor (gradients become a Gradient Paint). D1/D4.
 * Returns whether `key` matched (and was applied).
 */
function tryElementColorBucket(
  acc: SkinparamAccumulator,
  key: string,
  value: string,
): boolean {
  const elem = matchElementColorKey(key) ?? matchStereotypeSpotColorKey(key);
  if (elem === undefined) return false;
  const bucket = (acc.elements[elem.sname] ??= {});
  bucket[elem.role] = parseColor(value);
  return true;
}

/**
 * Element-scoped font size (`<sname>FontSize` / `<sname>StereotypeFontSize`)
 * → per-element bucket, numeric. G1 I4b. Returns whether `key` matched AND
 * carried a finite numeric value (a match with an invalid value is treated
 * as unhandled, matching the original switch's fallthrough).
 */
function tryElementFontSizeBucket(
  acc: SkinparamAccumulator,
  key: string,
  value: string,
): boolean {
  const fontElem = matchElementFontSizeKey(key);
  if (fontElem === undefined) return false;
  const size = Number(value);
  if (!Number.isFinite(size)) return false;
  const bucket = (acc.elements[fontElem.sname] ??= {});
  bucket[fontElem.role] = size;
  return true;
}

/**
 * `<sname>Shadowing` → per-element bucket. Jar-verified malado-53-noso561.
 * Returns whether `key` matched AND carried a parseable shadowing value.
 */
function tryElementShadowingBucket(
  acc: SkinparamAccumulator,
  key: string,
  value: string,
): boolean {
  const shadowElem = matchElementShadowingKey(key);
  if (shadowElem === undefined) return false;
  const parsedShadow = parseShadowingValue(value);
  if (parsedShadow === undefined) return false;
  const bucket = (acc.elements[shadowElem.sname] ??= {});
  bucket.shadowing = parsedShadow;
  return true;
}

/**
 * Fallback for a normalized key that matched no {@link KEY_HANDLER_MAP}
 * entry: tries each generic per-element bucket matcher in turn. Mirrors the
 * original switch `default` arm's exact fallthrough shape — a font-size
 * match that fails its own numeric guard falls through to the shadowing
 * matcher rather than short-circuiting to `unknown` immediately.
 */
function applyElementBucketFallback(
  acc: SkinparamAccumulator,
  key: string,
  value: string,
): void {
  if (tryElementColorBucket(acc, key, value)) return;
  if (tryElementFontSizeBucket(acc, key, value)) return;
  if (tryElementShadowingBucket(acc, key, value)) return;
  acc.unknown.push(key);
}

/**
 * Applies a single normalized, non stereotype-qualified skinparam key/value
 * pair to `acc`. Table lookup first; on a miss, delegates to the generic
 * per-element bucket fallback (see {@link applyElementBucketFallback}).
 */
export function applyNormalKey(
  acc: SkinparamAccumulator,
  key: string,
  value: string,
): void {
  const handler = KEY_HANDLER_MAP.get(key);
  if (handler !== undefined) {
    handler(acc, value, resolveColor(value));
    return;
  }
  applyElementBucketFallback(acc, key, value);
}
