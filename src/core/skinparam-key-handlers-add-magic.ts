/**
 * The per-`addMagic(SName)` skinparam handlers (`<sname>BorderStyle`,
 * `<sname>RoundCorner`) -- split out of skinparam-key-handlers-table-a.ts
 * (aepp-T1d) when RoundCorner took that file over the 500-line cap.
 * `KEY_HANDLERS_A` still appends `ADD_MAGIC_HANDLERS` last, in the same
 * order as before the split (BorderStyle entries, then RoundCorner), so no
 * existing entry is reordered.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:270-286
 */

import type { KeyHandler } from './skinparam-key-handlers-shared.js';
import { parseFiniteInt } from './skinparam-key-handlers-shared.js';
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

/** Both families, BorderStyle first (the pre-split append order). */
export const ADD_MAGIC_HANDLERS: ReadonlyArray<readonly [keys: readonly string[], handler: KeyHandler]> = [
  ...BORDER_STYLE_HANDLERS,
  ...ROUND_CORNER_HANDLERS,
];
