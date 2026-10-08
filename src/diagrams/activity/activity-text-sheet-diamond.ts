/**
 * activity-text-sheet-diamond -- a condition's own test label, drawn as the
 * `SheetBlock2` `ConditionalBuilder#getShape1` builds
 * (`vcompact/cond/ConditionalBuilder.java:240-247`): a `CreoleMode.FULL`
 * Sheet at the diamond style's font and alignment, inside a `SheetBlock1`
 * carrying `skinParam.getPadding()`, stencilled by `Hexagon.asStencil`, and
 * centred in the hexagon by `FtileDiamondInside#drawU`
 * (`vertical/FtileDiamondInside.java:85-96`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/ConditionalBuilder.java:240-247
 */
import type { Theme } from '../../core/theme.js';
import { activityFontSize, activityLineThickness } from './activity-style-defaults.js';
import { activityHorizontalAlignment } from './activity-text-style.js';
import { actColors } from './activity-renderer-shapes.js';
import { HEXAGON_HALF_SIZE } from './layout/hexagon-reservations.js';
import {
  activityDisplayBlock,
  activitySheet,
  activityTextFontConfiguration,
  drawActivityTextBlock,
} from './activity-text-sheet.js';
import { klimtStringBounder } from './activity-creole-sheet.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { LineBreakStrategy } from '../../core/klimt/LineBreakStrategy.js';
import { SheetBlock1 } from '../../core/klimt/creole/SheetBlock1.js';
import { SheetBlock2 } from '../../core/klimt/creole/SheetBlock2.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { chromeAtomOps } from '../../core/annotations/blocks-creole.js';
import { WidthTableMeasurer } from '../../core/measurer.js';
import type { Stencil } from '../../core/klimt/creole/Stencil.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { Paint } from '../../core/paint.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';

const ALIGNMENT_MAP: Record<'left' | 'center' | 'right', HorizontalAlignment> = {
  left: HorizontalAlignment.LEFT,
  center: HorizontalAlignment.CENTER,
  right: HorizontalAlignment.RIGHT,
};

const MEASURER = new WidthTableMeasurer();

/** `Hexagon.asStencil(tb)` (`ftile/Hexagon.java:84-104`): the stencil
 *  widens by `hexagonHalfSize * p` toward the middle row (`p = y / h * 2`,
 *  mirrored past 1), so a `----` separator spans the hexagon's slanted
 *  sides. */
export function hexagonAsStencil(tb: TextBlock): Stencil {
  const getDeltaX = (height: number, y: number): number => {
    const p = (y / height) * 2;
    return p <= 1 ? HEXAGON_HALF_SIZE * p : HEXAGON_HALF_SIZE * (2 - p);
  };
  return {
    getStartingX: (stringBounder, y) => -getDeltaX(tb.calculateDimension(stringBounder).getHeight(), y),
    getEndingX: (stringBounder, y) => {
      const dim = tb.calculateDimension(stringBounder);
      return dim.getWidth() + getDeltaX(dim.getHeight(), y);
    },
  };
}

/**
 * `ConditionalBuilder#getShape1`'s `tbTest` (`ConditionalBuilder.java:240-247`):
 * `skinParam.sheet(styleDiamonFont, styleDiamond.getHorizontalAlignment(),
 * CreoleMode.FULL).createSheet(labelTest)` in a `SheetBlock1(sheet,
 * diamondLineBreak, skinParam.getPadding())`, wrapped as `new
 * SheetBlock2(sheetBlock1, Hexagon.asStencil(sheetBlock1), thickness)` with
 * the diamond style's stroke. `diamondLineBreak` (`style.wrapWidth()`) is
 * `LineBreakStrategy.NONE`: no activity diamond `MaximumWidth` is modelled.
 */
export function diamondTestBlock(label: string, theme: Theme): SheetBlock2 {
  const fc = activityTextFontConfiguration(theme, activityFontSize(theme, 'diamond'), 'diamond');
  const sheet = activitySheet(label, theme, {
    fontConfiguration: fc,
    horizontalAlignment: ALIGNMENT_MAP[activityHorizontalAlignment(theme)],
    creoleMode: CreoleMode.FULL,
  });
  const sheet1 = new SheetBlock1(sheet, LineBreakStrategy.NONE, chromeAtomOps(undefined, fc), theme.padding ?? 0);
  return new SheetBlock2(
    sheet1,
    hexagonAsStencil(sheet1),
    UStroke.withThickness(activityLineThickness(theme, 'diamond')),
  );
}

/** The hexagon box the label is centred in, and its fill (`backColor`). */
export interface DiamondLabelBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fill?: Paint;
}

/**
 * `FtileDiamondInside#drawU`'s label draw (`FtileDiamondInside.java:85-96`):
 * `ug.apply(borderColor).apply(getStyle().getStroke()).apply(backColor.bg())`,
 * then `label.drawU(ug.apply(new UTranslate(lx, ly)))` with `lx =
 * (dimTotal.width - dimLabel.width) / 2`, `ly = (dimTotal.height -
 * dimLabel.height) / 2` in the hexagon's own frame.
 */
export function renderDiamondTestLabel(label: string, theme: Theme, box: DiamondLabelBox): string {
  const tb = diamondTestBlock(label, theme);
  const fc = activityTextFontConfiguration(theme, activityFontSize(theme, 'diamond'), 'diamond');
  const dim = tb.calculateDimension(klimtStringBounder(MEASURER, { family: fc.family, size: fc.size }));
  const lx = (box.width - dim.getWidth()) / 2;
  const ly = (box.height - dim.getHeight()) / 2;
  const c = actColors(theme);
  const changes = [
    new Fore(c.diamondBorder),
    UStroke.withThickness(activityLineThickness(theme, 'diamond')),
    new Back(box.fill ?? c.diamondFill),
  ];
  return drawActivityTextBlock(tb, { x: box.x + lx, y: box.y + ly }, theme, fc, changes);
}

/** The `'if-label'` fields {@link ifLabelBlock} reads. */
export interface IfLabelNode {
  readonly label?: string | undefined;
  readonly ifLabelRole?: 'test' | 'full' | undefined;
}

function ifLabelSName(node: IfLabelNode): 'diamond' | 'arrow' {
  return node.ifLabelRole === 'test' ? 'diamond' : 'arrow';
}

/** The font size an `'if-label'` draws at: the diamond style's for a test
 *  label (`styleDiamonFont`, `ConditionalBuilder.java:242`), the arrow
 *  style's for a branch label (`fontArrow`, `:281`). */
export function ifLabelFontSize(node: IfLabelNode, theme: Theme): number {
  return activityFontSize(theme, ifLabelSName(node));
}

/** The `TextBlock` an `'if-label'` node draws and the font it draws at:
 *  the condition test Sheet for `ifLabelRole: 'test'` (`FtileDiamond
 *  .withNorth(tbTest)`, `ConditionalBuilder.java:262-267`), else
 *  `getLabelPositive`'s `create0(fontArrow, LEFT, ..., CreoleMode.SIMPLE_LINE)`
 *  (`ConditionalBuilder.java:280-283`). Layout sizes, boxes and anchors the
 *  label with this same block. */
export function ifLabelBlock(
  node: IfLabelNode,
  theme: Theme,
): { readonly tb: TextBlock; readonly fc: FontConfiguration } {
  const label = node.label ?? '';
  const fc = activityTextFontConfiguration(theme, ifLabelFontSize(node, theme), ifLabelSName(node));
  if (node.ifLabelRole === 'test') return { tb: diamondTestBlock(label, theme), fc };
  const tb = activityDisplayBlock(label, theme, {
    fontConfiguration: fc,
    horizontalAlignment: HorizontalAlignment.LEFT,
    creoleMode: node.ifLabelRole === 'full' ? CreoleMode.FULL : CreoleMode.SIMPLE_LINE,
  });
  return { tb, fc };
}
