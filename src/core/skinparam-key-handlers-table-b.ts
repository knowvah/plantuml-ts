/**
 * Key -> handler table, half B (entries 37-73 of 73: footbox through
 * swimlanebordercolor) -- split out of skinparam-key-handlers.ts (itself
 * already the split target of skinparam.ts) because the table alone
 * formats to 527 lines, over this project's 500-line cap. See
 * skinparam-key-handlers.ts's own doc comment for why source order is
 * load-bearing: entries are NEVER reordered, sorted, or deduped by this
 * split. `KEY_HANDLERS_B` is concatenated AFTER `KEY_HANDLERS_A` (the
 * sibling first half) in the ORIGINAL order —
 * `[...KEY_HANDLERS_A, ...KEY_HANDLERS_B]` — by skinparam-key-handlers.ts.
 */

import type { KeyHandler } from './skinparam-key-handlers-shared.js';
import {
  parseFiniteFloat,
  parseFiniteNumber,
  parseFontStyleFlags,
  applyGuillemet,
} from './skinparam-key-handlers-shared.js';
import { parseShadowingValue } from './skinparam-element-buckets.js';

export const KEY_HANDLERS_B: ReadonlyArray<readonly [keys: readonly string[], handler: KeyHandler]> = [
  [
    ['footbox'],
    (acc, value) => {
      // Kept as the raw string: upstream compares it to "hide" and treats any
      // OTHER non-null value as show, overriding a `hide footbox` command
      // (`SequenceDiagram.java:478-485`).
      acc.footbox = value.trim();
    },
  ],
  [
    ['handwritten'],
    (acc, value) => {
      // `skinparam handwritten true` — `TitledDiagram#isHandwritten` feeds
      // `JsonDiagram#drawU`'s `new UGraphicHandwritten(ug)` (and every other
      // engine's). Sketchy rendering, seeded so it is reproducible.
      acc.handwritten = value.trim().toLowerCase() === 'true';
    },
  ],
  [
    ['monochrome'],
    (acc, value) => {
      const v = value.trim().toLowerCase();
      if (v === 'true' || v === 'reverse') acc.monochrome = v;
    },
  ],
  [
    ['fixcirclelabeloverlapping'],
    (acc, value) => {
      acc.fixCircleLabelOverlapping = value.trim().toLowerCase() === 'true';
    },
  ],
  [
    ['shadowing'],
    (acc, value) => {
      const parsed = parseShadowingValue(value);
      if (parsed !== undefined) acc.shadowing = parsed;
    },
  ],
  [
    ['classbackgroundcolor'],
    (acc, _v, color) => {
      acc.classBackground = color;
    },
  ],
  [
    ['classbordercolor'],
    (acc, _v, color) => {
      acc.classBorder = color;
    },
  ],
  [
    ['classborderthickness'],
    (acc, value) => {
      const v = parseFiniteFloat(value);
      if (v !== undefined) acc.classBorderThickness = v;
    },
  ],
  [
    ['arrowthickness'],
    (acc, value) => {
      const v = parseFiniteFloat(value);
      if (v !== undefined) acc.arrowThickness = v;
    },
  ],
  [
    ['interfacebackgroundcolor'],
    (acc, _v, color) => {
      acc.interfaceBackground = color;
    },
  ],
  [
    ['enumbackgroundcolor'],
    (acc, _v, color) => {
      acc.enumBackground = color;
    },
  ],
  [
    ['actorbordercolor'],
    (acc, _v, color) => {
      acc.actorStroke = color;
    },
  ],
  [
    ['packagebackgroundcolor'],
    (acc, _v, color) => {
      acc.packageBackground = color;
    },
  ],
  [
    ['packagebordercolor'],
    (acc, _v, color) => {
      acc.packageBorder = color;
    },
  ],
  [
    ['packageborderthickness'],
    (acc, value) => {
      const v = parseFiniteFloat(value);
      if (v !== undefined) acc.packageBorderThickness = v;
    },
  ],
  [
    ['classattributefontsize'],
    (acc, value) => {
      const v = parseFiniteNumber(value);
      if (v !== undefined) acc.classAttributeFontSize = v;
    },
  ],
  [
    ['classattributefontname'],
    (acc, value) => {
      acc.classAttributeFontFamily = value;
    },
  ],
  [
    ['classattributefontstyle'],
    (acc, value) => {
      const flags = parseFontStyleFlags(value);
      acc.classAttributeFontBold = flags.bold;
      acc.classAttributeFontItalic = flags.italic;
    },
  ],
  [
    ['classfontsize'],
    (acc, value) => {
      const v = parseFiniteNumber(value);
      if (v !== undefined) acc.classFontSize = v;
    },
  ],
  [
    ['classfontname'],
    (acc, value) => {
      acc.classFontFamily = value;
    },
  ],
  [
    ['classfontstyle'],
    (acc, value) => {
      const flags = parseFontStyleFlags(value);
      acc.classFontBold = flags.bold;
      acc.classFontItalic = flags.italic;
    },
  ],
  [
    ['classstereotypefontsize'],
    (acc, value) => {
      const v = parseFiniteNumber(value);
      if (v !== undefined) acc.classStereotypeFontSize = v;
    },
  ],
  [
    ['classstereotypefontname'],
    (acc, value) => {
      acc.classStereotypeFontFamily = value;
    },
  ],
  [
    ['classstereotypefontstyle'],
    (acc, value) => {
      const flags = parseFontStyleFlags(value);
      acc.classStereotypeFontBold = flags.bold;
      acc.classStereotypeFontItalic = flags.italic;
    },
  ],
  [
    ['circledcharacterfontsize'],
    (acc, value) => {
      const v = parseFiniteNumber(value);
      if (v !== undefined) acc.circledCharacterFontSize = v;
    },
  ],
  [
    ['circledcharacterradius'],
    (acc, value) => {
      const v = parseFiniteNumber(value);
      if (v !== undefined) acc.circledCharacterRadius = v;
    },
  ],
  [
    ['circledcharacterfontname'],
    (acc, value) => {
      acc.circledCharacterFontFamily = value;
    },
  ],
  [
    ['circledcharacterfontstyle'],
    (acc, value) => {
      const flags = parseFontStyleFlags(value);
      acc.circledCharacterFontBold = flags.bold;
      acc.circledCharacterFontItalic = flags.italic;
    },
  ],
  [['guillemet'], (acc, value) => applyGuillemet(acc, value)],
  [
    ['activitybackgroundcolor'],
    (acc, _v, color) => {
      acc.activityBackground = color;
    },
  ],
  [
    ['activitybordercolor'],
    (acc, _v, color) => {
      acc.activityBorder = color;
    },
  ],
  [
    ['activitybarcolor'],
    (acc, _v, color) => {
      acc.activityBarColor = color;
    },
  ],
  [
    ['activitydiamondbackgroundcolor'],
    (acc, _v, color) => {
      acc.activityDiamondBackground = color;
    },
  ],
  [
    ['activitydiamondforegroundcolor', 'activitydiamondbordercolor'],
    (acc, _v, color) => {
      acc.activityDiamondBorder = color;
    },
  ],
  [
    ['activitystartcolor'],
    (acc, _v, color) => {
      acc.activityStartColor = color;
    },
  ],
  [
    ['activityendcolor'],
    (acc, _v, color) => {
      acc.activityEndColor = color;
    },
  ],
  // D4 amendment (T1, 2026-09-09): `SwimlaneBorderColor` ->
  // `PName.LineColor` (divider stroke), `FromSkinparamToStyle.java:161`.
  [
    ['swimlanebordercolor'],
    (acc, _v, color) => {
      acc.swimlaneBorder = color;
    },
  ],
  // D4 amendment: `SwimlaneTitleBackgroundColor` -> `PName.BackGroundColor`
  // (title-band fill), `FromSkinparamToStyle.java:160` -- the key the
  // original decision mis-cited as `SwimlaneHeaderBackgroundColor`
  // (no `swimlaneheader*` match anywhere in ~/git/plantuml/src). The local
  // alias `swimlaneheaderbackgroundcolor` was accepted for this SAME field
  // before this mission and is kept for compatibility -- see
  // decisions.md D4's "Amended at execution" paragraph.
  [
    ['swimlanetitlebackgroundcolor', 'swimlaneheaderbackgroundcolor'],
    (acc, _v, color) => {
      acc.swimlaneHeaderBackground = color;
    },
  ],
  // D4 amendment: `SwimlaneBorderThickness` -> `PName.LineThickness`,
  // `FromSkinparamToStyle.java:162`. Sibling of `classborderthickness`
  // above -- same `parseFiniteFloat` convention.
  [
    ['swimlaneborderthickness'],
    (acc, value) => {
      const v = parseFiniteFloat(value);
      if (v !== undefined) acc.swimlaneBorderThickness = v;
    },
  ],
  // D4 amendment: `SwimlaneTitleFontColor` -> `PName.FontColor` via
  // `addConFont("SwimlaneTitle", SName.swimlane)`,
  // `FromSkinparamToStyle.java:159`. Stored RAW (like the neighbouring
  // `activity*color` handlers above), not resolved to hex -- T1 does not
  // consume the field, so there is no reader yet to dictate a form.
  [
    ['swimlanetitlefontcolor'],
    (acc, _v, color) => {
      acc.swimlaneTitleFontColor = color;
    },
  ],
  // D4 amendment: `SwimlaneTitleFontSize` -> `PName.FontSize` via
  // `addConFont("SwimlaneTitle", SName.swimlane)`,
  // `FromSkinparamToStyle.java:159`. Sibling of `classattributefontsize`
  // above -- same `parseFiniteNumber` convention.
  [
    ['swimlanetitlefontsize'],
    (acc, value) => {
      const v = parseFiniteNumber(value);
      if (v !== undefined) acc.swimlaneTitleFontSize = v;
    },
  ],
  // Edge-label word-wrap, `skin/SkinParam.java:971-978`'s two source keys.
  // Stored RAW (like `footbox`) -- `skinparam-theme-builder.ts` resolves the
  // `wrapmessagewidth`-over-`maxmessagesize` precedence via the already-
  // ported `LineBreakStrategy`, not here (see `theme.ts#maxMessageSize`'s
  // own doc comment for why this can't be one shared-field handler like
  // `fontname`/`defaultfontname`: whichever KEY was ever declared wins,
  // not whichever handler ran last).
  [
    ['maxmessagesize'],
    (acc, value) => {
      acc.maxMessageSize = value;
    },
  ],
  [
    ['wrapmessagewidth'],
    (acc, value) => {
      acc.wrapMessageWidth = value;
    },
  ],
];
