/**
 * `group`/`partition` frame rendering (`USymbolFrame#asBig`,
 * `decoration/symbol/USymbolFrame.java:136-170`, called by
 * `FtileGroup#drawU`, `ftile/vcompact/FtileGroup.java:209-227` --
 * `USymbols.PARTITION`/`USymbols.GROUP` are both a bare `USymbolFrame`,
 * `decoration/symbol/USymbols.java:81,87`). Split into its own module
 * (mission `activity-divergence-drive-2` T3g, family PART) rather than
 * added to `activity-renderer-shapes.ts` -- that file was already at the
 * 500-line cap; its `renderComposite` now just calls into here.
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type { CompositeUSymbol } from './activity-geometry.types.js';
import {
  compositeSymbolTitleOrigin,
  drawCompositeSymbol,
  type CompositeInk,
} from './activity-renderer-composite-symbols.js';
import { rect, path } from '../../core/svg.js';
import { fmt } from '../../core/svg-format.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { activityDisplayBlock, activityTextFontConfiguration, drawActivityTextBlock } from './activity-text-sheet.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { activityFontSize, activityLineThickness } from './activity-style-defaults.js';
import { WidthTableMeasurer } from '../../core/measurer.js';
import { frameTitleWidth } from './tiles/gtile-group.js';

/** `USymbolFrame#drawFrame` (`:68-97`): the title-tab underline, an OPEN
 *  (unfilled) 4-point path from the tab's top-right corner down past a
 *  `cornersize` dog-ear cut to the frame's own left edge. `fmt()` (not raw
 *  interpolation): `textWidth` is derived from `compositeTitleWidth`'s
 *  table-lookup sum, which can land a ULP off a clean decimal
 *  (`19.425000000000004`) -- `svg.ts#attrs` cleans that for every OTHER
 *  numeric attribute in this file, but a `d` string's embedded numbers
 *  bypass it entirely (`class-member-sprite-render.ts`'s own path
 *  builders are the established precedent for `fmt()` here). */
function compositeTabPath(x: number, y: number, textWidth: number, textHeight: number, cornerSize: number): string {
  const x1 = fmt(x + textWidth);
  const y2 = fmt(y + textHeight - cornerSize);
  const x2 = fmt(x + textWidth - cornerSize);
  const y3 = fmt(y + textHeight);
  return `M${x1},${fmt(y)} L${x1},${y2} L${x2},${y3} L${fmt(x)},${y3}`;
}

/** The renderer's own width table -- the SAME `WidthTableMeasurer` class
 *  `activity-text-placement.ts#measureLineWidth` reads. */
const TITLE_MEASURER = new WidthTableMeasurer();

/**
 * `dimTitle.getWidth()` of the frame title (`USymbolFrame.java:146,150`),
 * shared by the renderer and the compression adapter
 * (`layout/compress/shapes-of-frame.ts`) so both read one width.
 */
export function compositeTitleWidth(theme: Theme, title: string): number {
  return frameTitleWidth(title, TITLE_MEASURER, theme);
}

/** The frame's `<symbol>/composite` style colours (`FtileGroup.java:99-102`):
 *  `activityDiagram { composite { LineColor black; BackgroundColor transparent } }`
 *  (`plantuml.skin:364-368`), the root `FontColor black`, each overridden by
 *  the `Partition*` skinparams (`FromSkinparamToStyle.java:131-133`). */
interface CompositeStyle {
  readonly backColor: string;
  readonly borderColor: string;
  readonly fontColor: string;
}

function compositeStyle(theme: Theme): CompositeStyle {
  const g = theme.colors.graph;
  return {
    backColor: g.partitionBackground ?? 'none',
    borderColor: g.partitionBorder ?? '#000',
    fontColor: g.partitionFontColor === undefined ? '#000' : resolveColorToSvgHex(g.partitionFontColor),
  };
}

/**
 * `FtileGroup#drawU` (`:209-227`) + `USymbolFrame#asBig`'s `drawU`
 * (`:142-162`): the plain frame `rect` (unchanged from before this
 * mission), the title-tab underline `path`, and the title `text` at a
 * fixed `(3, 1)` inset. `node.label` carries the title verbatim
 * (`tile-coordinates.ts#walkTileGroup`).
 * `USymbolFrame#getWTitle`/`getYpos` (`:76-104`)'s `dimTitle.getWidth() ==
 * 0` branch (an untitled frame) is ported. `asBig`'s `widthFull -
 * widthTitle < 25` branch (`:152-156`) draws the SAME text either way
 * (`AbstractUGraphic.java:121-122` draws a `SpecialText` as its title); the
 * branch only changes the compression footprint, which
 * `layout/compress/shapes-of-frame.ts#frameTitleShape` ports.
 */
export function renderComposite(node: ActivityNodeGeo, theme: Theme): string {
  const strokeWidth = activityLineThickness(theme, 'composite');
  const style = compositeStyle(theme);
  // `FtileGroup.java:101`: the command's `#color`, else the style's `BackGroundColor`.
  const fill = node.color ?? style.backColor;
  if (node.usymbol !== undefined)
    return renderSymbolComposite(node, node.usymbol, theme, { fill, stroke: style.borderColor, strokeWidth });
  const body = rect(node.x, node.y, node.width, node.height, { fill, stroke: style.borderColor, strokeWidth });

  const fontSize = activityFontSize(theme, 'composite');
  const title = node.label ?? '';
  const titleWidth = compositeTitleWidth(theme, title);
  // `getWTitle`/`getYpos`/`drawFrame`'s own `cornersize` local (`:76-
  // 84,99-104`): an EMPTY title falls back to a width/height-derived tab.
  // `WidthTableMeasurer#measure`'s height is always the raw font size
  // (`activity-renderer-shapes.ts#ASCENT_FRACTION`'s own doc citation), so
  // `dimTitle.getHeight()` is `fontSize` directly, never re-measured.
  const textWidth = titleWidth === 0 ? node.width / 3 : titleWidth + 10;
  const cornerSize = titleWidth === 0 ? 7 : 10;
  const textHeight = titleWidth === 0 ? 12 : fontSize + 3;
  const tab = path(compositeTabPath(node.x, node.y, textWidth, textHeight, cornerSize), {
    fill: 'none',
    stroke: style.borderColor,
    strokeWidth,
  });

  if (title === '') return body + tab;
  // `USymbolFrame.java:154`: `title.drawU(ug.apply(new UTranslate(3, 1)))`.
  const titleEl = drawCompositeTitle(title, { x: node.x + 3, y: node.y + 1 }, theme);
  return body + tab + titleEl;
}

/**
 * `package`/`card`/`rectangle` (`activity-renderer-composite-symbols.ts`):
 * the symbol's own frame, then its title as a plain text block at the
 * symbol's own origin (`USymbolFolder.java:228`, `USymbolCard.java:133-134`,
 * `USymbolRectangle.java:125-133`).
 */
function renderSymbolComposite(
  node: ActivityNodeGeo,
  usymbol: CompositeUSymbol,
  theme: Theme,
  ink: CompositeInk,
): string {
  const fontSize = activityFontSize(theme, 'composite');
  const title = node.label ?? '';
  const titleWidth = compositeTitleWidth(theme, title);
  const dim = { width: titleWidth, height: title === '' ? 0 : fontSize };
  const frame = drawCompositeSymbol(node, usymbol, dim, ink);
  if (title === '') return frame;
  const origin = compositeSymbolTitleOrigin(node, usymbol, titleWidth);
  return frame + drawCompositeTitle(title, origin, theme);
}

/**
 * `FtileGroup`'s `name` (`FtileGroup.java:104-108`): `title.create(fc,
 * HorizontalAlignment.LEFT, skinParam)` -- a FULL creole Sheet at the
 * composite style's `getFontConfiguration` (`Style.java:259-268`, incl.
 * `HyperLinkColor`), drawn with its top-left at `at`.
 */
function drawCompositeTitle(title: string, at: { readonly x: number; readonly y: number }, theme: Theme): string {
  const fc = {
    ...activityTextFontConfiguration(theme, activityFontSize(theme, 'composite'), 'composite'),
    color: compositeStyle(theme).fontColor,
  };
  const tb = activityDisplayBlock(title, theme, {
    fontConfiguration: fc,
    horizontalAlignment: HorizontalAlignment.LEFT,
    creoleMode: CreoleMode.FULL,
  });
  return drawActivityTextBlock(tb, at, theme, fc);
}
