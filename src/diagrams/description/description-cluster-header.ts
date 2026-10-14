/**
 * `ClusterHeader`'s DOT-side sizing for a description group: the
 * `titleAndAttributeWidth/Height` the jar prints as the cluster's label
 * `<TABLE>` (`ClusterDotString.java:122-125`). Pure function; the drawing
 * side's `renderer-cluster.ts#buildHeader` supplies the SAME title/stereo
 * blocks, so the DOT table and the drawn header cannot measure different text.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java
 */
import type { Theme } from '../../core/theme.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import { resolveElementMinimumWidth } from '../../core/theme-element-resolve.js';
import { resolveSymbol } from '../../core/decoration/symbol/usymbol-resolve.js';
import { computeTitleTableHeight } from '../../core/cluster-title-table.js';
import { buildHeader } from './renderer-cluster.js';
import type { ContainerDesc } from './layout-types.js';
import type { DescriptionNodeGeo } from './layout-helpers.js';

/** `ClusterHeader.java:75` -- `titleAndAttributeHeight` is an `int` truncation
 *  of the summed double heights. */
function truncated(value: number): number {
  return Math.trunc(value);
}

/** The slice of {@link DescriptionNodeGeo} `buildHeader` reads (`symbol`,
 *  `display`, `stereotype`); geometry is irrelevant to a title block. */
function headerNode(container: ContainerDesc): DescriptionNodeGeo {
  return {
    id: container.astId,
    symbol: container.symbol,
    display: container.display,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    children: [],
    ...(container.stereotype === undefined ? {} : { stereotype: container.stereotype }),
    ...(container.stereotypeSprite === undefined ? {} : { stereotypeSprite: container.stereotypeSprite }),
  };
}

/**
 * `ClusterHeader#getTitleAndAttributeWidth/Height` for a description group,
 * as the DOT TABLE dims (height already net of `ClusterDotString.java:124`'s
 * `-5`). `undefined` iff `!cluster.isLabel()` (`Cluster.java:671-673`).
 *
 * - `dimLabel = mergeTB(stereo, title).calculateDimension` (`ClusterHeader.java:78-79`).
 * - `width = (int) max(dimLabel.w, attributeWidth) + uSymbol.suppWidthBecauseOfShape()`,
 *   then `Cluster#getTitleAndAttributeWidth` floors it at `ceil(MinimumWidth)`
 *   (`Cluster.java:261-264`).
 * - `height = (int)(dimLabel.h + attributeHeight + marginForFields + suppHeight)`;
 *   a description group has no state-description body, so the attribute terms are 0
 *   (`Entity.java:610-617`, empty `getRawBody()`).
 * - `container.stereotype` is the caller's already-visible list (`hide|show stereotype` is applied
 *   by `element-grammar.ts#visibleStereotypeLabels` before measuring, as for leaves).
 * - An anonymous group (`display === ''`) has no label lines, so `dimLabel.getWidth() == 0` and the
 *   cluster prints `label=""` (jar `mefule-86-calo549`'s `file {`); `StripeSimple.java:125-126`'s
 *   `" "` atom only applies to a Display that HAS a line (whitespace-only display).
 * - A group that is not a USymbol is `null` upstream; `resolveSymbol` returns
 *   `null` for the same case, giving 0/0 supplements.
 */
export function descriptionClusterTitleTable(
  container: ContainerDesc,
  theme: Theme,
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
): { width: number; height: number } | undefined {
  const header = buildHeader(headerNode(container), theme, { sprites });
  const stereoAndTitle = TextBlockUtils.mergeTB(header.stereo, header.title, header.titleHorizontalAlignment);
  const dimLabel = stereoAndTitle.calculateDimension(new MeasurerStringBounder(measurer));
  const symbol = resolveSymbol(container.symbol, theme);
  const suppWidth = symbol?.suppWidthBecauseOfShape() ?? 0;
  const suppHeight = symbol?.suppHeightBecauseOfShape() ?? 0;
  const labelWidth = dimLabel.getWidth() > 0 ? truncated(dimLabel.getWidth()) + suppWidth : 0;
  const labelHeight = dimLabel.getWidth() > 0 ? truncated(dimLabel.getHeight() + suppHeight) : 0;
  const minimumWidth = Math.ceil(resolveElementMinimumWidth(theme, container.symbol) ?? 0);
  const width = Math.max(labelWidth, minimumWidth);
  if (width <= 0 && labelHeight <= 0) return undefined;
  // Raw dims first; `computeTitleTableHeight(…) - 5` is the shared `-5` (ClusterDotString.java:124).
  return { width, height: computeTitleTableHeight([labelHeight], 0, 0, 0) };
}
