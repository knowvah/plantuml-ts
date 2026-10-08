/**
 * The text primitives the error, Welcome and Unsupported pages share: the
 * `HColors` and `GraphicStrings` font constants, the margins of
 * `PSystemError#getGraphicalFormatted`, the Creole subset the Welcome and
 * Unsupported strings use, and the one `<text>` emitter.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemError.java#getGraphicalFormatted
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java
 */

import type { FontSpec } from '../measurer.js';
import { text } from '../svg.js';

// --- Colors (klimt/color/HColors.java) ---------------------------------

export const BLACK = '#000000';
export const RED = '#FF0000';
/** `HColors.MY_GREEN` — the error diagram's foreground. */
export const MY_GREEN = '#33FF02';

// --- Fonts (klimt/shape/GraphicStrings.java) ----------------------------

export const SANS = 'sans-serif';
const MONO = 'monospace';
/** `GraphicStrings.sansSerif12` — Welcome / Unsupported text, and the banner. */
export const SIZE_12 = 12;
/** `GraphicStrings.sansSerif14` — every line of the error block proper. */
export const SIZE_14 = 14;

/** `GraphicStrings#margin` */
export const ERROR_PAGE_MARGIN = 5;

/** `PSystemError#getGraphicalFormatted`: `withMargin(…, 1, 1, 1, 4)` on the
 *  `[From … ]` band — left 1, right 1, top 1, bottom 4. */
export const BAND_PAD_X = 1;
export const BAND_PAD_TOP = 1;
export const BAND_PAD_BOTTOM = 4;

/** `PSystemError#getGraphicalFormatted`: `result4 = withMargin(…, 0, 2, 0,
 *  8)` on the version banner — left 0, right 2, top 0, bottom 8. */
export const HEADER_PAD_RIGHT = 2;
export const HEADER_PAD_BOTTOM = 8;

/** A run of characters sharing one font and color. */
export interface Run {
  readonly content: string;
  readonly font: FontSpec;
  readonly fill: string;
  readonly decoration?: string;
  /** `SvgGraphics#text`'s `textLength`: the width of the content blank-to-NBSP
   *  and trimmed (`DriverTextSvg.java:113-124`). `undefined` omits it. */
  readonly textLength?: number;
}

// --- Creole subset ------------------------------------------------------

/**
 * The markup upstream's `Display`/`Creole` layer resolves inside a
 * `GraphicStrings` block, restricted to what the Welcome and Unsupported
 * strings actually use: `<b>` / `<i>` / `<u>` (which apply to the REST of the
 * line when never closed — `<b>Welcome to PlantUML!` is a bold line, not a
 * literal `<b>`), and `""…""` (monospace).
 *
 * `src/core/creole.ts` is not reused here: its documented rule for unclosed
 * markup is to emit the delimiters literally, which would print `<b>` in the
 * Welcome header, and it has no monospace span (upstream's `""…""`) to switch
 * the font family on.
 */
const CREOLE_TOKEN = /<\/?[biu]>|""/giu;

export function parseCreoleSubset(source: string, baseFont: FontSpec, fill: string): Run[] {
  const runs: Run[] = [];
  let bold = baseFont.weight === 'bold';
  let italic = baseFont.style === 'italic';
  let underline = false;
  let mono = false;
  let cursor = 0;

  const flush = (end: number): void => {
    const content = source.slice(cursor, end);
    if (content.length === 0) return;

    runs.push({
      content,
      font: {
        family: mono ? MONO : baseFont.family,
        size: baseFont.size,
        weight: bold ? 'bold' : 'normal',
        style: italic ? 'italic' : 'normal',
      },
      fill,
      ...(underline ? { decoration: 'underline' } : {}),
    });
  };

  CREOLE_TOKEN.lastIndex = 0;
  let match = CREOLE_TOKEN.exec(source);
  while (match !== null) {
    flush(match.index);
    const token = match[0].toLowerCase();
    if (token === '""') mono = !mono;
    else if (token === '<b>') bold = true;
    else if (token === '</b>') bold = false;
    else if (token === '<i>') italic = true;
    else if (token === '</i>') italic = false;
    else if (token === '<u>') underline = true;
    else if (token === '</u>') underline = false;

    cursor = match.index + match[0].length;
    match = CREOLE_TOKEN.exec(source);
  }
  flush(source.length);
  return runs;
}

// --- Drawing ------------------------------------------------------------

/**
 * G2 N18 (already cited by `svg.ts#TextStyle.fontWeight`'s own doc comment):
 * the jar's deterministic-text SVG emits font-weight as the raw numeric
 * `"700"`, never the CSS keyword `"bold"` -- and OMITS both font-weight and
 * font-style entirely for the normal/non-italic case, rather than spelling
 * out `"normal"` (jar-verified against every cached error/Welcome-page
 * golden, e.g. `gantt/papava-92-geve698/in.svg`'s Welcome screen: `<text
 * ... font-size="12"> </text>` carries neither attribute). Every `FontSpec`
 * this module builds sets `weight`/`style` explicitly (never `undefined`),
 * so the omission has to happen HERE, at emission, not by relying on
 * `text()`'s own defaults.
 */
export function drawRun(run: Run, x: number, baseline: number): string {
  return text(x, baseline, run.content, {
    fontFamily: run.font.family,
    fontSize: run.font.size,
    ...(run.font.weight === 'bold' ? { fontWeight: '700' as const } : {}),
    ...(run.font.style === 'italic' ? { fontStyle: 'italic' as const } : {}),
    fill: run.fill,
    ...(run.decoration === undefined ? {} : { textDecoration: run.decoration }),
    ...(run.textLength === undefined ? {} : { textLength: run.textLength }),
  });
}
