/**
 * A `box`/`end box` englober's style paint and its placed title (sdd1 T2e).
 * Split out of `layout.ts`, which is past the 500-line cap; `layout.ts
 * #computeBoxGeos` places the box itself.
 */
import type { BoxGroup, TextRun } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { Colors } from '../../core/abel/Colors.js';
import { ColorType } from '../../core/abel/ColorType.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import type { HColor } from '../../core/style/Value.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import { dollStyle, paintOf, type SequencePaint } from './sequence-skin-param.js';
import { atomFontSpec } from './sequence-creole-text-atom.js';
import { offsetRun, sequenceCreoleRuns } from './sequence-creole.js';

/** A colour the style layer can hold (`Value.ts#HColor`); `Colors` keeps
 *  them opaque (`abel/Colors.ts#HColor`). */
function isStyleColor(color: object): color is HColor {
  return 'withDark' in color;
}

/** `colors.getColor(ColorType.BACK)` of the box's `ColorParser.simpleColor
 *  (BACK)` colour, `null` when none was written (`CommandBoxStart.java:117,
 *  126-128`). */
function boxBackColor(raw: string): HColor | undefined {
  if (raw === '') return undefined;
  const back = Colors.parse(raw, HColorSet.instance(), ColorType.BACK).getColor(ColorType.BACK);
  return back !== undefined && isStyleColor(back) ? back : undefined;
}

/**
 * `Doll#getUsedStyles` (`Doll.java:107-114`): `ENGLOBER` with the englober's
 * stereotype -- `Stereotype.build(stereo)`, the one-argument form
 * (`CommandBoxStart.java:123`) -- its `BackGroundColor` replaced by the box
 * colour, merged from the builder at tile time (`Doll.java:81-83`).
 */
export function boxPaint(box: BoxGroup): SequencePaint {
  const style = dollStyle(box.styleBuilder, Stereotype.build(box.stereotype), boxBackColor(box.color));
  return paintOf(style, HColorSet.instance());
}

/** The box's drawn extent, as `computeBoxGeos` placed it. */
export interface BoxFrame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

/**
 * The title, placed: `ComponentRoseEnglober#drawBackgroundInternalU`
 * (`:65-71`) draws the text block at `dx((width - getPureTextWidth) / 2)` and
 * no `dy`, its top on the box's top. The block is `create0` at the box style's
 * font (`AbstractTextualComponent.java:80,91`, `box { FontSize 13; FontStyle
 * bold }`, `plantuml.skin:172-177`); its 3 px side margins
 * (`ComponentRoseEnglober.java:58`) are symmetric, so the glyphs start
 * `(width - glyph width) / 2` in. One line: the label is never split.
 */
export function boxLabelRuns(
  label: string,
  frame: BoxFrame,
  paint: SequencePaint,
  measurer: StringMeasurer,
): readonly TextRun[] {
  if (label === '') return [];
  const spec = atomFontSpec(paint.font);
  const ascent = measurer.measure('M', spec).height - measurer.getDescent(spec, 'M');
  const runs = sequenceCreoleRuns(label, paint.font, { leftX: 0, baselineY: frame.y + ascent }, measurer);
  const last = runs.at(-1);
  const width = last === undefined ? 0 : last.x + last.textWidth;
  return runs.map((run) => offsetRun(run, frame.x + (frame.width - width) / 2, 0));
}
