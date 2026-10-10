/**
 * Key -> handler table, half A (entries 1-36 of 73: backgroundcolor through
 * style) -- split out of skinparam-key-handlers.ts (itself already the
 * split target of skinparam.ts) because the table alone formats to 527
 * lines, over this project's 500-line cap. See skinparam-key-handlers.ts's
 * own doc comment for why source order is load-bearing: entries are NEVER
 * reordered, sorted, or deduped by this split. `KEY_HANDLERS_A` is
 * concatenated with `KEY_HANDLERS_B` (the sibling second half) in the
 * ORIGINAL order — `[...KEY_HANDLERS_A, ...KEY_HANDLERS_B]` — by
 * skinparam-key-handlers.ts.
 */

import type { KeyHandler } from './skinparam-key-handlers-shared.js';
import {
  arrowFontColorValue,
  parseFiniteNumber,
  parseFiniteInt,
  parseNonZeroInt,
  parseFontStyleFlags,
} from './skinparam-key-handlers-shared.js';
import { ActorStyle } from './skin/ActorStyle.js';
import type { ElementColors } from './theme-graph-colors.js';
import { parseColor } from './paint.js';
import { convertBorderStyleValue, lineStyleDash } from './style-line-style.js';

/**
 * cdd6 T1a: every `addMagic(SName)` registration's clean name, lowercased as
 * `normaliseKey` delivers it (`sname.name().replace("_", "")`,
 * `FromSkinparamToStyle.java:271`). Each registers `<name>BorderStyle` as
 * `PName.LineStyle` on `{<sname>}` (`:277`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:78-85,129,210-230,270-285
 */
const ADD_MAGIC_CLEAN_NAMES = [
  'participant',
  'boundary',
  'control',
  'collections',
  'actor',
  'database',
  'entity',
  'package',
  'agent',
  'artifact',
  'card',
  'interface',
  'cloud',
  'component',
  'file',
  'folder',
  'frame',
  'hexagon',
  'node',
  'person',
  'queue',
  'rectangle',
  'stack',
  'storage',
  'usecase',
  'map',
  'archimate',
  'hnote',
  'rnote',
] as const;

/** `<sname>BorderStyle X` -> the `{<sname>}` bucket: the LineStyle, plus the
 *  `bold` (LineThickness 2) and `text:` (FontColor) side effects a complex
 *  value registers on the same signature (`convertBorderStyleValue`). */
function applyBorderStyle(bucket: ElementColors, value: string): void {
  const converted = convertBorderStyleValue(value.trim());
  if (converted.lineThickness !== undefined) bucket.lineThickness = converted.lineThickness;
  if (converted.fontColor !== undefined) bucket.font = parseColor(converted.fontColor);
  if (converted.lineStyle !== undefined) bucket.lineStyle = lineStyleDash(converted.lineStyle);
}

const BORDER_STYLE_HANDLERS: ReadonlyArray<readonly [keys: readonly string[], handler: KeyHandler]> =
  ADD_MAGIC_CLEAN_NAMES.map((sname) => [
    [`${sname}borderstyle`],
    (acc, value) => {
      applyBorderStyle((acc.elements[sname] ??= {}), value);
    },
  ]);

/** `<sname>RoundCorner N` -> `PName.RoundCorner` on `{<sname>}`
 *  (`addMagic`, `FromSkinparamToStyle.java:275`), RAW and unhalved like the
 *  `<style>` path (`style-map-element.ts:350`). Like the bare `roundcorner`
 *  handler, 0 is a real value; only a non-number is rejected. */
const ROUND_CORNER_HANDLERS: ReadonlyArray<readonly [keys: readonly string[], handler: KeyHandler]> =
  ADD_MAGIC_CLEAN_NAMES.map((sname) => [
    [`${sname}roundcorner`],
    (acc, value) => {
      const v = parseFiniteInt(value);
      if (v !== undefined) (acc.elements[sname] ??= {}).roundCorner = v;
    },
  ]);

export const KEY_HANDLERS_A: ReadonlyArray<readonly [keys: readonly string[], handler: KeyHandler]> = [
  [
    ['backgroundcolor'],
    // T2d-a pass 2 (DOCGRAD): `paint` (4th arg) recovers a real `Gradient`
    // (`HColorSet.java:78-119`) into its own field; `acc.background` stays
    // the flattened end-colour every other reader already gets.
    (acc, _v, color, paint) => {
      acc.background = color;
      if (typeof paint !== 'string') acc.backgroundGradient = paint;
    },
  ],
  [
    ['bordercolor'],
    (acc, _v, color) => {
      acc.border = color;
    },
  ],
  // SI26 D4: `defaultFontColor` -> root FontColor (`FromSkinparamToStyle
  // .java:157`), which the arrow signature inherits -- so it ALSO sets the
  // arrow-label colour. Handlers run in source order, so `ArrowFontColor
  // green` then `defaultFontColor red` -> red, and the reverse -> green
  // (`StyleStorage#computeMergedStyle`'s OVERWRITE_EXISTING_VALUE, oracle
  // experiments b/g in plans/arrow-label-font-colour/decisions.md).
  [
    ['fontcolor', 'defaultfontcolor'],
    (acc, v, color) => {
      acc.text = color;
      const hex = arrowFontColorValue(v, color);
      if (hex !== undefined) acc.arrowFontColor = hex;
    },
  ],
  [
    ['arrowcolor', 'defaultarrowcolor'],
    // cdd7-T1a (D3): the Paint, not the flattened `color` -- upstream keeps
    // the `HColorGradient` (`HColorSet.java:109-116`) all the way to
    // `DriverRectangleSvg#applyStrokeColor` (java:103-107).
    (acc, _v, _color, paint) => {
      acc.arrow = paint;
    },
  ],
  // T2c: `FromSkinparamToStyle.java:153` (`addConvert("arrowHeadColor",
  // PName.HeadColor, SName.arrow)`) -- sibling of `arrowcolor` above, same
  // Paint-not-flattened-color rationale (`decoration/Rainbow.java:84-95`
  // keeps the HColor, never a hex string, through to the draw).
  [
    ['arrowheadcolor'],
    (acc, _v, _color, paint) => {
      acc.arrowHeadColor = paint;
    },
  ],
  // cdd7-T1a (D2): `ColorParam.arrowLollipop` (`ColorParam.java:71`), read
  // with no default by `SvekEdge.java:266-268` (`getHtmlColor(ColorParam
  // .arrowLollipop, null, false)`, null when unset -> backgroundColor).
  [
    ['arrowlollipopcolor'],
    (acc, _v, color) => {
      acc.arrowLollipopColor = color;
    },
  ],
  // `FontParam.ARROW` size override. Sibling of arrowcolor above, NOT a
  // bucket key -- `ELEMENT_BUCKET_SNAMES` has no 'arrow' entry and does not
  // need one (D3: extend the existing model, do not restructure it).
  [
    ['arrowfontsize'],
    (acc, value) => {
      const v = parseFiniteNumber(value);
      if (v !== undefined) acc.arrowFontSize = v;
    },
  ],
  // D3: siblings of `arrowfontsize` above -- `FromSkinparamToStyle.java:149`
  // (`addConFont("arrow", SName.arrow)`) registers `arrowFontName`/
  // `arrowFontStyle` the SAME way as `arrowFontSize` (PName.FontName/
  // FontStyle on SName.arrow). `arrowfontstyle` rides through UNPARSED (raw
  // string) -- `arrow-label-font.ts#resolveArrowLabelFont` is the ONE reader
  // that maps it onto weight/style (`klimt/font/FontStyle.java`).
  [
    ['arrowfontname'],
    (acc, value) => {
      acc.arrowFontFamily = value;
    },
  ],
  [
    ['arrowfontstyle'],
    (acc, value) => {
      acc.arrowFontStyle = value;
    },
  ],
  // SI26 D1: `FromSkinparamToStyle.java:424-429` (`addConFont`) registers
  // `arrowFontColor` as `PName.FontColor` on `SName.arrow`.
  // Stored RESOLVED (`resolveColorToSvgHex`, `XColor#toSvg`) unlike its
  // raw-valued neighbours: the `<style>` path (`style-cascade-class.ts
  // #cascadeFontColorHex`) lands hex in the same field, and the renderers
  // (T3-T5) draw it verbatim.
  [
    ['arrowfontcolor'],
    (acc, v, color) => {
      const hex = arrowFontColorValue(v, color);
      if (hex !== undefined) acc.arrowFontColor = hex;
    },
  ],
  [
    ['notebackgroundcolor'],
    (acc, _v, color) => {
      acc.noteBackground = color;
    },
  ],
  [
    ['pathhovercolor'],
    (acc, _v, color) => {
      acc.pathHoverColor = color;
    },
  ],
  [
    ['diagrambordercolor'],
    (acc, _v, color) => {
      acc.diagramBorderColor = color;
    },
  ],
  [
    ['iconprivatecolor'],
    (acc, _v, _color, paint) => {
      acc.iconPrivateColor = paint;
    },
  ],
  [
    ['iconprivatebackgroundcolor'],
    (acc, _v, color) => {
      acc.iconPrivateBackgroundColor = color;
    },
  ],
  [
    ['iconpackagecolor'],
    (acc, _v, _color, paint) => {
      acc.iconPackageColor = paint;
    },
  ],
  [
    ['iconpackagebackgroundcolor'],
    (acc, _v, color) => {
      acc.iconPackageBackgroundColor = color;
    },
  ],
  [
    ['iconprotectedcolor'],
    (acc, _v, _color, paint) => {
      acc.iconProtectedColor = paint;
    },
  ],
  [
    ['iconprotectedbackgroundcolor'],
    (acc, _v, color) => {
      acc.iconProtectedBackgroundColor = color;
    },
  ],
  [
    ['iconpubliccolor'],
    (acc, _v, _color, paint) => {
      acc.iconPublicColor = paint;
    },
  ],
  [
    ['iconpublicbackgroundcolor'],
    (acc, _v, color) => {
      acc.iconPublicBackgroundColor = color;
    },
  ],
  // not colors — raw values
  [
    ['fontname', 'defaultfontname'],
    (acc, value) => {
      acc.fontFamily = value;
    },
  ],
  // cdd2-T8 (S-10): `skinparam defaultMonospacedFontName <name>` --
  // `SkinParam.java:1092`'s `getValue("defaultMonospacedFontName",
  // Parser.MONOSPACED)` -- the REAL font name substituted for the logical
  // `monospaced` token BEFORE `renameLogicalMonospace`'s CSS-generic
  // fallback ever runs (`svg-text-font.ts`'s own doc comment). No prior
  // handler existed for this key at all (confirmed by exhaustive grep).
  [
    ['defaultmonospacedfontname'],
    (acc, value) => {
      acc.monospacedFontName = value;
    },
  ],
  [
    ['fontsize'],
    (acc, value) => {
      acc.fontSize = Number(value);
    },
  ],
  [
    ['defaultfontsize'],
    (acc, value) => {
      // R2j mizupo-59: an EXPLICIT defaultFontSize is a DISTINCT tier of
      // SkinParam#getFontSize (SkinParam.java:441-448), between per-param
      // skinparams and each FontParam's own default -- record the explicit-set
      // marker (theme.ts#defaultFontSize) alongside the ambient fontSize. The
      // finite guard mirrors upstream's isDigits check (a garbage value falls
      // through to the FontParam default, it does not poison the tier).
      acc.fontSize = Number(value);
      acc.defaultFontSize = parseFiniteNumber(value);
    },
  ],
  [
    ['linetype'],
    (acc, value) => {
      const v = value.trim().toLowerCase();
      if (v === 'ortho' || v === 'polyline') acc.linetype = v;
    },
  ],
  [
    ['nodesep'],
    (acc, value) => {
      const v = parseNonZeroInt(value);
      if (v !== undefined) acc.nodeSep = v;
    },
  ],
  [
    ['ranksep'],
    (acc, value) => {
      const v = parseNonZeroInt(value);
      if (v !== undefined) acc.rankSep = v;
    },
  ],
  [
    ['wrapwidth'],
    (acc, value) => {
      const v = parseNonZeroInt(value);
      if (v !== undefined) acc.wrapWidth = v;
    },
  ],
  [
    ['dpi'],
    (acc, value) => {
      // cdd-T30: `SkinParam#getDpi()` (`skin/SkinParam.java:649-656`):
      // `getAsInt("dpi", 96)` -- `getAsInt` itself only accepts a value
      // matching `isDigits` (`\d+`, NO sign/decimal point,
      // `SkinParam.java:135-137`), else returns the 96 default outright;
      // then `dpi <= 0 -> 96` (reachable only via the literal string "0",
      // since a minus sign already fails `isDigits`). `parseNonZeroInt`
      // (`Number.parseInt`) is NOT reused here -- unlike nodesep/ranksep/
      // wrapwidth, it would accept a leading "-" upstream's `isDigits`
      // rejects, silently diverging from the jar on a negative dpi.
      const trimmed = value.trim();
      if (/^\d+$/.test(trimmed)) {
        const v = Number.parseInt(trimmed, 10);
        if (v > 0) acc.dpi = v;
      }
    },
  ],
  [
    // cdd-T34 (E14 `topurl`): `SkinParam#getValue("topurl")` -- a raw
    // string, no validation upstream (`classdiagram/command/
    // CommandCreateClass.java:219`).
    ['topurl'],
    (acc, value) => {
      acc.topurl = value;
    },
  ],
  [
    ['sameclasswidth'],
    (acc, value) => {
      // A2s B7: `SkinParam#sameClassWidth()` (SkinParam.java:994) — boolean
      // valueOf; only an explicit true/false is meaningful.
      if (value === 'true') acc.sameClassWidth = true;
      else if (value === 'false') acc.sameClassWidth = false;
    },
  ],
  [
    ['classattributeiconsize'],
    (acc, value) => {
      // A2s F-G A13: `SkinParam#classAttributeIconSize()` --
      // `getAsInt("classAttributeIconSize", 10)` (SkinParam.java:554-556).
      // 0 IS meaningful (icons off, `MethodsOrFieldsArea#hasSmallIcon`
      // java:125-127), so the zero-rejecting parser is wrong here --
      // parseFiniteInt, mirroring tabsize's own no-zero-is-unset precedent.
      const v = parseFiniteInt(value);
      if (v !== undefined) acc.classAttributeIconSize = v;
    },
  ],
  [
    ['groupinheritance'],
    (acc, value) => {
      // A2s A10/B3: `DotData.java:136-151` — values <= 1 mean "never group",
      // handled by the consumer; store the parsed int as-is.
      const v = parseNonZeroInt(value);
      if (v !== undefined) acc.groupInheritance = v;
    },
  ],
  [
    ['minclasswidth'],
    (acc, value) => {
      // S1L-g: `SkinParam` maps `minClassWidth` to `PName.MinimumWidth`, the
      // leaf-box content-width floor. Zero-is-unset (0 == no floor == default).
      const v = parseNonZeroInt(value);
      if (v !== undefined) acc.minimumWidth = v;
    },
  ],
  [
    ['tabsize'],
    (acc, value) => {
      // G3/O4: `SkinParam#getTabSize()` -- `getAsInt("tabsize", 8)`, no
      // zero-is-unset convention (unlike nodesep/ranksep/wrapwidth) -- this
      // parse site stores the raw configured value verbatim.
      const v = parseFiniteInt(value);
      if (v !== undefined) acc.tabSize = v;
    },
  ],
  [
    ['roundcorner'],
    (acc, value) => {
      // G2 N65 item 47: unlike nodesep/ranksep/wrapwidth (which treat 0 as
      // "unset"), RoundCorner 0 is a REAL, meaningful jar value (sharp
      // corners) -- only NaN is rejected.
      const v = parseFiniteInt(value);
      if (v !== undefined) acc.roundCorner = v;
    },
  ],
  [
    ['componentstyle'],
    (acc, value) => {
      const v = value.trim().toLowerCase();
      if (v === 'uml2' || v === 'uml1' || v === 'rectangle') acc.componentStyle = v;
    },
  ],
  // T1p-a: SkinParam.getConditionEndStyle (SkinParam.java:1007-1013) --
  // ConditionEndStyle.fromString is case-insensitive (ConditionEndStyle
  // .java:43-50); an unrecognized/absent value falls back to DIAMOND, so an
  // unmatched token here is simply left unset (acc default `undefined`
  // already reads as diamond downstream).
  [
    ['conditionendstyle'],
    (acc, value) => {
      const v = value.trim().toLowerCase();
      if (v === 'diamond' || v === 'hline') acc.conditionEndStyle = v;
    },
  ],
  // SkinParam.java:1209-1218 `actorStyle()`: case-insensitive
  // `"awesome"`/`"hollow"`, else STICKMAN (verbatim -- an unrecognized value
  // falls through to STICKMAN, it is not rejected/unknown).
  [
    ['actorstyle'],
    (acc, value) => {
      const v = value.trim().toLowerCase();
      if (v === 'awesome') acc.actorStyle = ActorStyle.AWESOME;
      else if (v === 'hollow') acc.actorStyle = ActorStyle.HOLLOW;
      else acc.actorStyle = ActorStyle.STICKMAN;
    },
  ],
  [
    ['packagestyle'],
    (acc, value) => {
      const v = value.trim().toLowerCase();
      if (v === 'rect' || v === 'rectangle') acc.packageStyle = 'rect';
    },
  ],
  [
    ['style'],
    (acc, value) => {
      if (value.trim().toLowerCase() === 'strictuml') acc.strictUml = true;
    },
  ],
  // cdd3-T25 (E3-3): `SkinParam.java:1180-1181` `valueIs("genericDisplay",
  // "old")` -- case-insensitive equality against the literal "old"; any
  // other value (including absent) leaves the flag unset.
  [
    ['genericdisplay'],
    (acc, value) => {
      if (value.trim().toLowerCase() === 'old') acc.genericDisplayOld = true;
    },
  ],
  // T3d: `addConFont("activityDiamond", SName.diamond)`
  // (`FromSkinparamToStyle.java:147`) registers all four FontSize/FontStyle/
  // FontColor/FontName keys on `SName.diamond` -- the SAME `diamond` bucket
  // `activityFontSize`/`activityFontColor` (`activity-style-defaults.ts`,
  // `activity-text-style.ts`) already read via `theme.colors.elements
  // .diamond`, unlike the BackgroundColor/BorderColor pair (table-b.ts,
  // dedicated accumulator fields predating this bucket). `diamond` is
  // already an `ELEMENT_BUCKET_SNAMES` member, but the COMPOUND
  // `activitydiamond*` key never reaches the generic
  // `matchElementFontSizeKey` fallback (its suffix-strip would leave
  // `activitydiamond`, not `diamond`), so each needs its own dedicated
  // entry, mirroring `applyBorderStyle`'s `acc.elements[sname] ??= {}`
  // shape. Placed here (table-a, not table-b) only to stay under the
  // 500-line hook -- these are brand-new keys with no prior entry to stay
  // in source order relative to, so appending here cannot reorder
  // anything (cdd6 T1a precedent, same file, line above).
  // @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:147,424-429
  [
    ['activitydiamondfontsize'],
    (acc, value) => {
      const size = parseFiniteNumber(value);
      if (size !== undefined) (acc.elements['diamond'] ??= {}).fontSize = size;
    },
  ],
  [
    ['activitydiamondfontstyle'],
    (acc, value) => {
      (acc.elements['diamond'] ??= {}).fontStyle = parseFontStyleFlags(value);
    },
  ],
  [
    ['activitydiamondfontcolor'],
    (acc, _v, _color, paint) => {
      (acc.elements['diamond'] ??= {}).font = paint;
    },
  ],
  [
    ['activitydiamondfontname'],
    (acc, value) => {
      (acc.elements['diamond'] ??= {}).fontFamily = value;
    },
  ],
  // cdd6 T1a: `<sname>BorderStyle` for every addMagic SName (new keys, so
  // appending cannot reorder any existing entry).
  ...BORDER_STYLE_HANDLERS,
  ...ROUND_CORNER_HANDLERS,
];
