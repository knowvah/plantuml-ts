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

import type { DividerEvent, DividerGeo } from './ast.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { DIVIDER_LABEL_DELTA_X, DIVIDER_PADDING, dividerPreferredHeight } from './divider-style.js';
import { componentLabelBlock, offsetRun, symbolInk, type LabelBlock } from './sequence-creole-sheet.js';
import type { EventCursor, EventProcessingContext } from './sequence-layout-events.js';
import { dividerStyle, paintOf, type SequencePaint } from './sequence-skin-param.js';

/**
 * The divider's text block: `create0` at the separator style's font
 * (`ComponentRoseDivider.java:66-68`), its padding's sides as margins
 * (`topRightBottomLeft(4, 4, 4, 4)`, `:67`), drawn after `background.bg()`,
 * `borderColor` and the style's stroke (`:84,97-98`) -- what a `----` rule or a
 * table grid in the label inherits.
 */
function dividerLabelBlock(lines: readonly string[], paint: SequencePaint, ctx: EventProcessingContext): LabelBlock {
  const opts = { sprites: ctx.sprites, ink: symbolInk(paint), marginX1: DIVIDER_PADDING, marginX2: DIVIDER_PADDING };
  return componentLabelBlock(lines, paint.font, opts, ctx.measurer);
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
  // `\n` splits the label into a multi-line text block, exactly as it does for
  // a `ref` body (`text-block-geo.ts#refBodyLines`): the widest line drives the
  // width and the line COUNT drives the height. Jar-verified on
  // `pigifu-13-kele137`, whose `== divi\ndummy ==` golden carries a 34-tall
  // label box (two 13px lines plus the 4+4 padding), not a 21-tall one.
  const lines = event.text.split('\n');
  // An empty label is a `TextBlockEmpty` (height 0,
  // `AbstractTextualComponent.java:86-87`). The runs are relative to the label
  // BOX's own top-left -- the block sits at `(deltaX, getOldPaddingY())` in it
  // (`ComponentRoseDivider.java:91-93,103`); `backfillDividerWidth` drops them
  // onto the band once `bandX`/`bandWidth` are known (Step 3), the same
  // construct-then-resolve split `y`/`branchSeparators` use above.
  const block = dividerLabelBlock(lines, paint, ctx);
  const labelRuns = block.primitives.map((r) => offsetRun(r, DIVIDER_LABEL_DELTA_X, DIVIDER_PADDING));
  const blockHeight = block.height;
  const blockWidth = block.width;
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
