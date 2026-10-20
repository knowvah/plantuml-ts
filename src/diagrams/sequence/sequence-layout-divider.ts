/**
 * Sequence diagram layout — the `== label ==` / `====` divider tile.
 *
 * Split out of `sequence-layout-events.ts` (500-line file cap, sdd1 T2b).
 *
 * `Divider` merges its style in the CONSTRUCTOR, from the builder current at
 * its command (`sequencediagram/Divider.java:59-61`, signature `root, element,
 * sequenceDiagram, separator`, `ComponentType.java:89-90`), and
 * `ComponentRoseDivider` reads every paint value and the label font off it
 * (`skin/rose/ComponentRoseDivider.java:66-74`). The geo carries that style's
 * paint; layout measures with its font, the renderer draws with the rest.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Divider.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseDivider.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/DividerTile.java
 */

import type { DividerEvent, DividerGeo, TextRun } from './ast.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { DIVIDER_LABEL_DELTA_X, DIVIDER_PADDING, dividerPreferredHeight } from './divider-style.js';
import { sequenceCreoleRuns } from './sequence-creole.js';
import { atomFontSpec } from './sequence-creole-text-atom.js';
import { blockWidthOf, type EventCursor, type EventProcessingContext } from './sequence-layout-events.js';
import { dividerStyle, paintOf } from './sequence-skin-param.js';

/**
 * A divider label's runs, positioned RELATIVE to the label box's own top-left.
 *
 * `ComponentRoseDivider#drawInternalU` draws the block at
 * `(xpos + deltaX, ypos + getOldPaddingY())` (`:91-93,103`), where `deltaX` is
 * 6 and the padding is `topRightBottomLeft(4, 4, 4, 4)`. Both terms are known
 * here; `xpos`/`ypos` are not, because they are centred within a band whose
 * width `backfillDividerWidth` resolves in Step 3 — so these carry the inner
 * offset and that function adds the outer one.
 */
function dividerLabelRuns(
  lines: readonly string[],
  font: FontConfiguration,
  ctx: EventProcessingContext,
): readonly TextRun[] {
  const spec = atomFontSpec(font);
  const lineHeight = ctx.measurer.measure('M', spec).height;
  const ascent = lineHeight - ctx.measurer.getDescent(spec, 'M');
  // C6: one run per creole atom -- a divider's label is an
  // `AbstractTextualComponent` `Display` like every other sequence label
  // (`ComponentRoseDivider.java:66-68`); `bakuba-09-fica741` is the last one.
  return lines.flatMap((line, i) =>
    sequenceCreoleRuns(
      line,
      font,
      { leftX: DIVIDER_LABEL_DELTA_X, baselineY: DIVIDER_PADDING + ascent + i * lineHeight },
      ctx.measurer,
    ),
  );
}

/**
 * `DividerTile` (`teoz/DividerTile.java`) reserves exactly its component's own
 * `getPreferredHeight` and nothing more — tiles stack on `YGauge` with no gap
 * between them — so the cursor advances by that height, not by a spacing.
 *
 * The label's own box is sized here too, from the SAME measurement, and the
 * renderer only reads it: see `DividerGeo`'s own doc comment.
 *
 * The label font is the separator style's (`AbstractTextualComponent` builds
 * the text block from `style.getFontConfiguration`, ComponentRoseDivider
 * .java:67-68) — `separator { FontSize 13; FontStyle bold }` by default
 * (`plantuml.skin:184-185`), not the diagram font.
 */
export function handleDividerEvent(event: DividerEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  const paint = paintOf(dividerStyle(event.styleBuilder), HColorSet.instance());
  const font = paint.font;
  // `\n` splits the label into a multi-line text block, exactly as it does for
  // a `ref` body (`text-block-geo.ts#refBodyLines`): the widest line drives the
  // width and the line COUNT drives the height. Jar-verified on
  // `pigifu-13-kele137`, whose `== divi\ndummy ==` golden carries a 34-tall
  // label box (two 13px lines plus the 4+4 padding), not a 21-tall one.
  const lines = event.text.split('\n');
  const lineHeight = ctx.measurer.measure('M', atomFontSpec(font)).height;
  // Relative to the label BOX's own top-left; `backfillDividerWidth` drops
  // them onto the band once `bandX`/`bandWidth` are known (Step 3), the same
  // construct-then-resolve split `y`/`branchSeparators` use above. C6: the
  // reserved width is that CREOLE block's, less the `deltaX` the runs already
  // carry -- `getTextWidth` reads `calculateDimension`, not the display string.
  const labelRuns = dividerLabelRuns(lines, font, ctx);
  const blockWidth = Math.max(0, blockWidthOf(labelRuns) - DIVIDER_LABEL_DELTA_X);
  const blockHeight = lines.length * lineHeight;
  const dividerGeo: DividerGeo = {
    kind: 'divider',
    text: event.text,
    lines,
    y: cursor.y,
    bandX: 0, // both back-filled once totalWidth is known (Step 3)
    bandWidth: 0,
    height: dividerPreferredHeight(blockHeight),
    textWidth: blockWidth + DIVIDER_PADDING * 2,
    textHeight: blockHeight + DIVIDER_PADDING * 2,
    labelRuns,
    paint,
  };
  ctx.eventGeos.push(dividerGeo);
  ctx.dividerGeos.push(dividerGeo);
  cursor.y += dividerGeo.height;
}
