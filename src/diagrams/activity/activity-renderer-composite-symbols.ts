/**
 * The three non-frame container symbols `FtileGroup#drawU` can draw
 * (`type.asBig(name, align, TextBlockUtils.empty(0, 0), ...)`,
 * `ftile/vcompact/FtileGroup.java:216-219`): `package` -> `USymbolFolder`,
 * `card` -> `USymbolCard`, `rectangle` -> `USymbolRectangle`
 * (`CommandPartition3#getUSymbol`, `CommandPartition3.java:89-106`;
 * `USymbols.java:69,86,91`). The stereotype block passed is always empty,
 * so every `dimStereo` below is `0 x 0`. Split from
 * `activity-renderer-composite.ts` (add4-T2b), which keeps `USymbolFrame`.
 *
 * The geometry helpers are shared with the compression adapter
 * (`layout/compress/shapes-of-frame.ts`): none of these symbols is
 * ignorable for compression -- `URectangle.build(...)` and `UPolygon` carry
 * no ignore flag, and the title is a plain `UText` -- so the frame occupies
 * its full box on both axes, unlike `USymbolFrame`.
 */

import type { ActivityNodeGeo, CompositeUSymbol } from './activity-geometry.types.js';
import { rect, polygon, line } from '../../core/svg.js';

/** `USymbolFolder`'s title margins (`USymbolFolder.java:60-65`). */
const FOLDER_MARGIN_TITLE_X1 = 3;
const FOLDER_MARGIN_TITLE_X2 = 3;
const FOLDER_MARGIN_TITLE_X3 = 7;
const FOLDER_MARGIN_TITLE_Y1 = 3;
const FOLDER_MARGIN_TITLE_Y2 = 3;
/** `title.drawU(ug.apply(new UTranslate(4, 2)))` (`USymbolFolder.java:228`). */
const FOLDER_TITLE_DX = 4;
/** The title's `dy` in all three `asBig`s: `2` (folder `:228`), `2 +
 *  dimStereo.getHeight()` (card `USymbolCard.java:133-134`, rectangle
 *  `USymbolRectangle.java:133`) with an empty stereotype. */
const TITLE_DY = 2;
/** `drawCard`'s `top = dimTitle.getHeight() + dimStereo.getHeight() + 4`
 *  (`USymbolCard.java:126-127`). */
const CARD_TOP_EXTRA = 4;

/** The stroke/fill every symbol draws with (`Fashion`, `FtileGroup.java:213-214`). */
export interface CompositeInk {
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
  /** The style's RAW `RoundCorner` (`FtileGroup.java:103`); `rx`/`ry` are
   *  each half (`URectangle#rounded`). Drawn by `card`/`rectangle` only. */
  readonly roundCorner?: number;
}

/** `rx`/`ry` of the symbol's `URectangle` (`USymbolCard.java:60`,
 *  `USymbolRectangle.java:67-69`): half the style's `RoundCorner`. */
function cornerAttrs(ink: CompositeInk): { rx?: number; ry?: number } {
  const half = (ink.roundCorner ?? 0) / 2;
  return half === 0 ? {} : { rx: half, ry: half };
}

/** The title's measured block (`dimTitle`); `width === 0` for an empty title. */
export interface TitleDim {
  readonly width: number;
  readonly height: number;
}

/** `USymbolFolder#getWTitle`/`getHTitle` (`USymbolFolder.java:127-144`). */
function folderTitleBox(nodeWidth: number, title: TitleDim): { w: number; h: number } {
  if (title.width === 0) return { w: Math.max(30, nodeWidth / 4), h: 10 };
  return {
    w: title.width + FOLDER_MARGIN_TITLE_X1 + FOLDER_MARGIN_TITLE_X2,
    h: title.height + FOLDER_MARGIN_TITLE_Y1 + FOLDER_MARGIN_TITLE_Y2,
  };
}

/**
 * The top-left corner of the title block. `package` draws it at `(4, 2)`;
 * `card` centres it (`posTitle = (width - dimTitle.getWidth()) / 2`,
 * `USymbolCard.java:133`); `rectangle` follows `labelAlignment`
 * (`USymbolRectangle.java:125-131`), which `FtileGroup` reads from
 * `packageTitleAlignment`, default `CENTER` (`AlignmentParam.java:44`).
 */
export function compositeSymbolTitleOrigin(
  node: ActivityNodeGeo,
  usymbol: CompositeUSymbol,
  titleWidth: number,
): { x: number; y: number } {
  const x = usymbol === 'package' ? node.x + FOLDER_TITLE_DX : node.x + (node.width - titleWidth) / 2;
  return { x, y: node.y + TITLE_DY };
}

/** `USymbolFolder#drawFolder`, `roundCorner == 0` branch (`USymbolFolder.java
 *  :85-102,123-124`): the tabbed polygon, then `ULine.hline(wtitle +
 *  marginTitleX3)` at `dy(htitle)`. */
function drawFolder(node: ActivityNodeGeo, title: TitleDim, ink: CompositeInk): string {
  const { x, y, width, height } = node;
  const { w, h } = folderTitleBox(width, title);
  const pts = [
    { x, y },
    { x: x + w, y },
    { x: x + w + FOLDER_MARGIN_TITLE_X3, y: y + h },
    { x: x + width, y: y + h },
    { x: x + width, y: y + height },
    { x, y: y + height },
    { x, y },
  ];
  const stroke = { stroke: ink.stroke, strokeWidth: ink.strokeWidth };
  return polygon(pts, { fill: ink.fill, ...stroke }) + line(x, y + h, x + w + FOLDER_MARGIN_TITLE_X3, y + h, stroke);
}

/** `USymbolCard#drawCard` (`USymbolCard.java:59-66`): the rectangle, then a
 *  full-width `ULine.hline` at `top` when `top != 0`. */
function drawCard(node: ActivityNodeGeo, title: TitleDim, ink: CompositeInk): string {
  const { x, y, width, height } = node;
  const stroke = { stroke: ink.stroke, strokeWidth: ink.strokeWidth };
  const top = title.height + CARD_TOP_EXTRA;
  return (
    rect(x, y, width, height, { fill: ink.fill, ...stroke, ...cornerAttrs(ink) }) +
    line(x, y + top, x + width, y + top, stroke)
  );
}

/**
 * The frame shape (no title) of a non-`USymbolFrame` container. `rectangle`
 * is `USymbolRectangle#drawRect` (`USymbolRectangle.java:65-71`), a bare
 * `URectangle` (`roundCorner` 0, no `diagonalCorner`).
 */
export function drawCompositeSymbol(
  node: ActivityNodeGeo,
  usymbol: CompositeUSymbol,
  title: TitleDim,
  ink: CompositeInk,
): string {
  if (usymbol === 'package') return drawFolder(node, title, ink);
  if (usymbol === 'card') return drawCard(node, title, ink);
  return rect(node.x, node.y, node.width, node.height, {
    fill: ink.fill,
    stroke: ink.stroke,
    strokeWidth: ink.strokeWidth,
    ...cornerAttrs(ink),
  });
}
