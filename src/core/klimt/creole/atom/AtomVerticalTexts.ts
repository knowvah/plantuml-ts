/**
 * AtomVerticalTexts — the atom `AtomTextUtils#createUrl` returns when a
 * `[[url label]]` label has more than one display line: one stacked text per
 * line, each carrying the url.
 *
 * Upstream: `klimt/creole/atom/AtomVerticalTexts.java` —
 * ```java
 * calculateDimensionSlow: width = max of the lines' widths, height = sum of
 *                         the lines' heights                       // :55-64
 * getStartingAltitude   : all.get(0).getStartingAltitude(...)      // :67-69
 * drawU                 : y = 0; for each: text.drawU(ug.apply(UTranslate.dy(y)));
 *                         y += text.calculateDimension(...).getHeight()  // :71-78
 * ```
 * Each stacked line is what `AtomTextUtils#createAtomTextForUrl` returned for
 * it (`AtomTextUtils.java:121-159`): ONE atom when the line resolved to a
 * single piece, else an `AtomHorizontalTexts` (`AtomHorizontalTexts.java:
 * 52-81`: width = SUM, height = MAX, the first piece's starting altitude, each
 * piece drawn at `dx = running width`, `dy = lineAltitude - pieceAltitude`).
 * A line is therefore a `readonly CreoleAtom[]` here, and a one-element line
 * is the atom itself (no horizontal wrapper, no extra translate).
 *
 * Ported as pure functions over {@link AtomOps} (the `CreoleAtom` union is
 * data-only; see `atom/AtomSpace.ts` for the same shape): the dimension, the
 * starting altitude, and the placement of every drawn piece.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomVerticalTexts.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomHorizontalTexts.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomTextUtils.java:79-92
 */
import type { StringBounder } from '../../font/StringBounder.js';
import { XDimension2D } from '../../geom/XDimension2D.js';
import type { UGraphic } from '../../UGraphic.js';
import { UTranslate } from '../../UTranslate.js';
import type { AtomOps } from '../Sea.js';
import type { CreoleAtom } from './Atom.js';

/** One stacked line: the atoms `createAtomTextForUrl` produced for it. */
export type VerticalTextsLine = readonly CreoleAtom[];

/** The measuring half of {@link AtomOps}: a sizing-only seam (no `drawU`)
 *  can still size and align a stack. */
export type MeasureOps = Pick<AtomOps, 'calculateDimension' | 'getStartingAltitude'>;

/** The altitude half alone: a seam that only aligns atoms (`Sea`'s
 *  `getStartingAltitude` table) needs no dimensions. */
export type AltitudeOps = Pick<AtomOps, 'getStartingAltitude'>;

/** `AtomHorizontalTexts#calculateDimensionSlow` (`:52-62`); a one-piece
 *  line is the piece itself. */
function lineDimension(line: VerticalTextsLine, ops: MeasureOps, stringBounder: StringBounder): XDimension2D {
  let width = 0;
  let height = 0;
  for (const piece of line) {
    const dim = ops.calculateDimension(piece, stringBounder);
    height = Math.max(height, dim.getHeight());
    width += dim.getWidth();
  }
  return new XDimension2D(width, height);
}

/** `AtomHorizontalTexts#getStartingAltitude` (`:64-69`): 0 when empty, else
 *  the first piece's. */
function lineStartingAltitude(line: VerticalTextsLine, ops: AltitudeOps, stringBounder: StringBounder): number {
  const first = line[0];
  return first === undefined ? 0 : ops.getStartingAltitude(first, stringBounder);
}

/** `AtomVerticalTexts#calculateDimensionSlow` (`:54-64`). */
export function verticalTextsDimension(
  lines: readonly VerticalTextsLine[],
  ops: MeasureOps,
  stringBounder: StringBounder,
): XDimension2D {
  let width = 0;
  let height = 0;
  for (const line of lines) {
    const dim = lineDimension(line, ops, stringBounder);
    width = Math.max(width, dim.getWidth());
    height += dim.getHeight();
  }
  return new XDimension2D(width, height);
}

/** `AtomVerticalTexts#getStartingAltitude` (`:67-69`): `all.get(0)`'s. */
export function verticalTextsStartingAltitude(
  lines: readonly VerticalTextsLine[],
  ops: AltitudeOps,
  stringBounder: StringBounder,
): number {
  const first = lines[0];
  if (first === undefined) throw new Error('IndexOutOfBoundsException');
  return lineStartingAltitude(first, ops, stringBounder);
}

/** `AtomVerticalTexts#drawU` (`:71-78`) composed with `AtomHorizontalTexts
 *  #drawU` (`:71-82`) for a multi-piece line: every piece is drawn under its
 *  own translate. */
export function drawVerticalTexts(lines: readonly VerticalTextsLine[], ops: AtomOps, ug: UGraphic): void {
  const stringBounder = ug.getStringBounder();
  let y = 0;
  for (const line of lines) {
    const lineUg = ug.apply(UTranslate.dy(y));
    if (line.length === 1) {
      ops.drawU(line[0] as CreoleAtom, lineUg);
    } else {
      const altitude = lineStartingAltitude(line, ops, stringBounder);
      let x = 0;
      for (const piece of line) {
        const local = ops.getStartingAltitude(piece, stringBounder);
        ops.drawU(piece, lineUg.apply(new UTranslate(x, altitude - local)));
        x += ops.calculateDimension(piece, stringBounder).getWidth();
      }
    }
    y += lineDimension(line, ops, stringBounder).getHeight();
  }
}
