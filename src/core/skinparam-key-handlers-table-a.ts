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
} from './skinparam-key-handlers-shared.js';
import { ActorStyle } from './skin/ActorStyle.js';

export const KEY_HANDLERS_A: ReadonlyArray<readonly [keys: readonly string[], handler: KeyHandler]> = [
  [
    ['backgroundcolor'],
    (acc, _v, color) => {
      acc.background = color;
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
    (acc, _v, color) => {
      acc.text = color;
      const hex = arrowFontColorValue(color);
      if (hex !== undefined) acc.arrowFontColor = hex;
    },
  ],
  [
    ['arrowcolor', 'defaultarrowcolor'],
    (acc, _v, color) => {
      acc.arrow = color;
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
    (acc, _v, color) => {
      const hex = arrowFontColorValue(color);
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
    (acc, _v, color) => {
      acc.iconPrivateColor = color;
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
    (acc, _v, color) => {
      acc.iconPackageColor = color;
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
    (acc, _v, color) => {
      acc.iconProtectedColor = color;
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
    (acc, _v, color) => {
      acc.iconPublicColor = color;
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
];
