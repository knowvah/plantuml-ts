/**
 * sequence-creole-text-atom.ts — one creole `'text'` atom as sequence
 * `TextRun`s, and a raw line's width for sizing. Split out of
 * `sequence-creole.ts` (500-line cap) when unwind2-S3 made a text atom
 * yield one run per tab-separated token (`AtomText#drawU`,
 * `klimt/creole/legacy/AtomText.java:210-231`).
 */
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { FontStyle, getFont } from '../../core/klimt/shape/UText.js';
import { atomTextWidth, hasTabulation, layoutTabbedText } from '../../core/klimt/creole/legacy/AtomText.js';
import { CharHidder } from '../../core/utils/CharHidder.js';
import type { TextRun } from './text-block-geo.js';

/**
 * The `FontSpec` one atom is MEASURED at — its own family and its EFFECTIVE
 * (muted) size.
 *
 * `getFont` applies `FontPosition.mute` at READ time, upstream's own
 * `FontConfiguration#getFont()` behaviour (`FontConfiguration.java:98-104`),
 * so a `<sup>`/`<sub>` run measures 3 smaller while the stored configuration
 * keeps the size a nested `<size:N>` set. Identical to the stored size for
 * every NORMAL run, which is all of them until `<sup>`/`<sub>` appears.
 */
export function atomFontSpec(font: FontConfiguration): FontSpec {
  return {
    family: font.family,
    size: getFont(font).size,
    ...(font.styles.has(FontStyle.BOLD) ? { weight: 'bold' as const } : {}),
    ...(font.styles.has(FontStyle.ITALIC) ? { style: 'italic' as const } : {}),
  };
}

/**
 * The whole `text-decoration` attribute for one run's style flags — a port of
 * `DriverTextSvg`'s own `StringBuilder decorations` cascade, in its order:
 *
 * ```java
 * if (fontConfiguration.containsStyle(FontStyle.UNDERLINE) ...) decorations.append("underline ");
 * if (fontConfiguration.containsStyle(FontStyle.STRIKE))        decorations.append("line-through ");
 * if (fontConfiguration.containsStyle(FontStyle.WAVE))          decorations.append("wavy underline ");
 * final String textDecoration = decorations.length() > 0 ? decorations.toString().trim() : null;
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverTextSvg.java:139-160
 *
 * The `getUnderlineStroke().getThickness() > 0` guard and the
 * `getExtendedColor()` branches (which draw separate `<line>`s instead of a
 * decoration) have no counterpart on this port's minimal `FontConfiguration`
 * — `UText.ts`'s own doc comment records that deferral.
 */
function creoleDecoration(styles: ReadonlySet<FontStyle>): string | undefined {
  const parts: string[] = [];
  if (styles.has(FontStyle.UNDERLINE)) parts.push('underline');
  if (styles.has(FontStyle.STRIKE)) parts.push('line-through');
  if (styles.has(FontStyle.WAVE)) parts.push('wavy underline');
  return parts.length > 0 ? parts.join(' ') : undefined;
}

/**
 * One `'text'` atom as placed, measured `TextRun`s -- one per token of
 * `AtomText#drawU`'s tab walk (java:210-231), so a tab advances the next
 * token to its stop and draws nothing (unwind2-S3).
 *
 * The three metrics are the MEASURER's answer at this atom's OWN font (D5) —
 * `DriverTextSvg` resolves the same quantities from its `StringBounder`
 * before emitting (`DriverTextSvg.java:125-126,179`). `textAscent` is
 * measured rather than derived from the font size for the reason
 * `TextRun.textAscent` records: the `size - size/4.5` shorthand disagrees
 * with `FixedMeasurer`.
 */
export function textAtomRuns(
  atom: Extract<CreoleAtom, { kind: 'text' }>,
  x: number,
  baselineY: number,
  measurer: StringMeasurer,
): TextAtomRuns {
  const spec = atomFontSpec(atom.font);
  // `AtomText.java:79` unhides in the CONSTRUCTOR — i.e. per atom, after the
  // command scan has already resolved against the hidden text, and BEFORE the
  // atom is measured or drawn. So the tile-escaped character is restored here
  // and every metric below is taken from the restored string.
  const shown = CharHidder.unhide(atom.text);
  // `AtomText#drawU` (java:213-215): ONE baseline for the whole run, off the
  // whole run's height and descent; the tokens then sit at their tab stops.
  const dim = measurer.measure(shown, spec);
  const textAscent = dim.height - measurer.getDescent(spec, shown);
  const layout = layoutTabbedText(shown, spec.size, (s) => measurer.measure(s, spec).width);
  const decoration = creoleDecoration(atom.font.styles);
  const style = {
    textAscent,
    textLineHeight: dim.height,
    fontFamily: spec.family,
    fontSize: spec.size,
    ...(atom.font.styles.has(FontStyle.BOLD) ? { bold: true } : {}),
    ...(atom.font.styles.has(FontStyle.ITALIC) ? { italic: true } : {}),
    ...(atom.font.color !== null ? { color: atom.font.color } : {}),
    ...(decoration !== undefined ? { decoration } : {}),
    ...(atom.url !== undefined ? { url: atom.url } : {}),
  };
  // A tab-free run keeps its ONE run even when empty: callers read line
  // metrics off it, and that is the shape this producer always had.
  const tokens = hasTabulation(shown) ? layout.tokens : [{ text: shown, x: 0, width: layout.width }];
  const runs = tokens.map((t) => ({ text: t.text, x: x + t.x, y: baselineY, textWidth: t.width, ...style }));
  return { runs, width: layout.width };
}

/** {@link textAtomRuns}'s result: one run per drawn token, and the ATOM's
 *  own x-advance (`AtomText#getWidth`, which a trailing tab widens). */
export interface TextAtomRuns {
  readonly runs: readonly TextRun[];
  readonly width: number;
}

/**
 * A raw display line's width for a layout-time SIZING decision (lifeline
 * spacing, exo extent, canvas width) -- `AtomText#getWidth` (java:239-256), so
 * a tab advances to its stop exactly as {@link sequenceCreoleRuns} draws it.
 * A tab-free line is the single `measure(line)` these sites always made.
 */
export function sequenceLineWidth(line: string, spec: FontSpec, measurer: StringMeasurer): number {
  return atomTextWidth(line, spec.size, (s) => measurer.measure(s, spec).width);
}
