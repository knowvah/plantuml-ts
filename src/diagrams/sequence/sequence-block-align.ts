/**
 * A sequence component's text BLOCK at its style's font and alignment (sdd1
 * T3a): one `Display` line per stripe, stacked by the font's line height,
 * each shifted inside the block by `SheetBlock1#initMap`'s
 * `(maxWidth - width) / coef` -- coef 2 for CENTER, 1 for RIGHT, 0 (no
 * shift) for LEFT (`klimt/creole/SheetBlock1.java:155-193`).
 *
 * The frame header, the `else` condition, the `ref` header and body and the
 * delay text all build their block this way: `AbstractTextualComponent`
 * creates it with the style's `FontConfiguration` and `HorizontalAlignment`
 * (`skin/AbstractTextualComponent.java:78-91`), or with an explicit LEFT
 * (`ComponentRoseGroupingHeader.java:90`, `ComponentRoseReference.java:78`).
 */
import type { StringMeasurer } from '../../core/measurer.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { TextRun } from './text-block-geo.js';
import { atomFontSpec } from './sequence-creole-text-atom.js';
import { offsetRun, sequenceCreoleRuns, type SequenceAtomContext } from './sequence-creole.js';

/** A block's runs as placed, its width (the widest stripe) and the line
 *  height its stripes stack by. */
export interface PlacedBlock {
  readonly runs: readonly TextRun[];
  readonly width: number;
  readonly lineHeight: number;
}

/** Where a block goes: its left edge and the top of its first line. */
export interface BlockOrigin {
  readonly leftX: number;
  readonly top: number;
}

/** `SheetBlock1#getCoef(HorizontalAlignment)` (`SheetBlock1.java:181-193`). */
function coefOf(align: HorizontalAlignment | undefined): number {
  if (align === HorizontalAlignment.CENTER) return 2;
  if (align === HorizontalAlignment.RIGHT) return 1;
  return 0;
}

/** A stripe's advance: its last run's right edge (a non-text atom advances
 *  x without a run of its own, so never a sum of widths). */
function stripeWidth(runs: readonly TextRun[]): number {
  const last = runs.at(-1);
  return last === undefined ? 0 : last.x + last.textWidth;
}

/**
 * `lines` as one block at `font`, its first line's top at `origin.top`. The
 * first baseline is the line height less the descent, as `TextBlockSimple`
 * stacks its stripes (`klimt/shape/TextBlockSimple.java:78-89`).
 */
export function alignedBlockRuns(
  lines: readonly string[],
  font: FontConfiguration,
  origin: BlockOrigin,
  align: HorizontalAlignment | undefined,
  context: { readonly measurer: StringMeasurer; readonly atoms?: SequenceAtomContext | undefined },
): PlacedBlock {
  const { measurer, atoms } = context;
  const spec = atomFontSpec(font);
  const lineHeight = measurer.measure('M', spec).height;
  const ascent = lineHeight - measurer.getDescent(spec, 'M');
  const rows = lines.map((line, i) =>
    sequenceCreoleRuns(line, font, { leftX: 0, baselineY: origin.top + ascent + i * lineHeight }, measurer, atoms),
  );
  const widths = rows.map(stripeWidth);
  const width = Math.max(0, ...widths);
  const coef = coefOf(align);
  const runs = rows.flatMap((row, i) => {
    const shift = coef === 0 ? 0 : (width - widths[i]!) / coef;
    return row.map((run) => offsetRun(run, origin.leftX + shift, 0));
  });
  return { runs, width, lineHeight };
}
