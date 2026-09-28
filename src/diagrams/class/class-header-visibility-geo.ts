/**
 * cdd5-T4b (entity-visibility-icon-dropped): the class header's visibility
 * icon block. `EntityImageClassHeader` merges the entity's
 * `VisibilityModifier#getUBlock` LEFT of the name block before the name's own
 * 3px side margins are applied:
 *
 *   final TextBlock uBlock = TextBlockUtils.withMargin(
 *       modifier.getUBlock(getSkinParam().classAttributeIconSize(), fore, back, false), 0, 0, 4, 0);
 *   name = TextBlockUtils.mergeLR(uBlock, name, VerticalAlignment.CENTER);
 *   name = TextBlockUtils.withMargin(name, 3, 3, 0, 0);
 *
 * `withMargin(tb, x1, x2, y1, y2)` is `TextBlockMarged(tb, y1, x2, y2, x1)`
 * (top, right, bottom, left), so the `4` is a TOP margin: the block is
 * `size + 1` wide and `size + 1 + 4` tall. `TextBlockHorizontal` (CENTER)
 * centres each part on the merged height.
 *
 * Split into its own module purely for the 500-line cap on
 * class-layout-header-geo.ts.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClassHeader.java:109-121
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockUtils.java:75-78
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockHorizontal.java (drawU)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/VisibilityModifier.java:94-102
 */
import type { Classifier, Visibility } from './ast.js';
import type { ClassifierRowGeo } from './class-geo-row-types.js';
import { VISIBILITY_ICON_SIZE } from './class-visibility-icon.js';

/** The `withMargin(uBlock, 0, 0, 4, 0)` top margin,
 *  `svek/image/EntityImageClassHeader.java:117-118`. */
export const HEADER_VISIBILITY_TOP_MARGIN = 4;

export interface HeaderVisibilityBlock {
  modifier: Visibility;
  /** `getUBlock#calculateDimension` width: raw `classAttributeIconSize + 1`. */
  width: number;
  /** The same `size + 1` plus {@link HEADER_VISIBILITY_TOP_MARGIN}. */
  height: number;
}

/** The icon block for a classifier carrying a visibility modifier, else
 *  `undefined` (`modifier == null` branch, java:110-111). `iconSize` is the
 *  raw `classAttributeIconSize` (default {@link VISIBILITY_ICON_SIZE}). */
export function headerVisibilityBlock(
  classifier: Classifier,
  iconSize: number = VISIBILITY_ICON_SIZE,
): HeaderVisibilityBlock | undefined {
  const modifier = classifier.visibilityModifier;
  if (modifier === undefined) return undefined;
  return { modifier, width: iconSize + 1, height: iconSize + 1 + HEADER_VISIBILITY_TOP_MARGIN };
}

/** `mergeLR(uBlock, name, CENTER)`'s dimension: widths add, heights max.
 *  `nameTextDy` is the name text's own CENTER offset inside the merged
 *  block. Field names match `computeHeaderNameGeo`'s return, which spreads
 *  this in. */
export function mergeNameWithVisibility(
  classifier: Classifier,
  nameWidth: number,
  nameHeight: number,
): { nameWidth: number; nameBlockHeight: number; nameTextDy: number; visibilityBlock?: HeaderVisibilityBlock } {
  const visibilityBlock = headerVisibilityBlock(classifier);
  if (visibilityBlock === undefined) return { nameWidth, nameBlockHeight: nameHeight, nameTextDy: 0 };
  const merged = Math.max(nameHeight, visibilityBlock.height);
  return {
    nameWidth: nameWidth + visibilityBlock.width,
    nameBlockHeight: merged,
    nameTextDy: (merged - nameHeight) / 2,
    visibilityBlock,
  };
}

/** The merged-name fields {@link attachHeaderVisibilityIcon} reads. */
export interface MergedNameGeo {
  readonly visibilityBlock?: HeaderVisibilityBlock;
  readonly nameBlockHeight: number;
  readonly headerLineWidths: readonly number[];
}

/**
 * Tags the widest name row (its `indent` is the text block's own left edge
 * for every alignment, so the icon sits `block.width` left of it) with the
 * icon. `visibilityBlockTopDy` is the glyph origin (block top + the 4px top
 * margin) relative to that row's baseline; the renderer draws it before the
 * first name row, matching `TextBlockHorizontal#drawU`'s left-to-right order.
 * `nameTop` is the merged block's top (`HeaderLayout#drawU`'s `yName`).
 */
export function attachHeaderVisibilityIcon(
  rows: ClassifierRowGeo[],
  geo: MergedNameGeo,
  nameTop: number,
): ClassifierRowGeo[] {
  const block = geo.visibilityBlock;
  if (block === undefined || rows.length === 0) return rows;
  const index = Math.max(0, geo.headerLineWidths.indexOf(Math.max(...geo.headerLineWidths)));
  const blockTop = nameTop + (geo.nameBlockHeight - block.height) / 2;
  return rows.map((row, i) =>
    i !== index
      ? row
      : {
          ...row,
          visibilityIcon: block.modifier,
          visibilityIsField: false,
          visibilityBlockTopDy: blockTop + HEADER_VISIBILITY_TOP_MARGIN - row.y,
        },
  );
}
