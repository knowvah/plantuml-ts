/**
 * A group frame's measurements that need no layout (sdd2 T3c2), split out of
 * `sequence-layout-frame.ts` so the participant row's frame clearance
 * (`sequence-layout-group-clearance.ts`) can read them without importing the
 * event walk: `GroupingTile`'s margins, the frame's paints and its header
 * component (`ComponentRoseGroupingHeader`).
 */
import type { FrameEvent, TextRun } from './ast.js';
import type { HColor } from '../../core/style/Value.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { displayLines, TRANSPARENT_SVG } from './text-block-geo.js';
import { sequenceAtomContext, sequenceCreoleRuns, type SequenceAtomContext } from './sequence-creole.js';
import { atomFontSpec } from './sequence-creole-text-atom.js';
import { alignedBlockRuns } from './sequence-block-align.js';
import { groupingHeaderDisplay, HEADER_PADDING } from './frame-style.js';
import { groupingStyle, paintOf, type SequencePaint } from './sequence-skin-param.js';

/** `GroupingTile.MARGINX` (`teoz/GroupingTile.java:90`): how far a frame
 *  reaches beyond the tiles it contains, on each side. */
export const FRAME_MARGIN_X = 16;
/** `GroupingTile.EXTERNAL_MARGINX1` (`:83`): `getMinX` is the frame's left
 *  border less this (`:984-986`). */
export const FRAME_EXTERNAL_MARGIN_X1 = 3;
/** `GroupingTile.EXTERNAL_MARGINX2` (`:84`): `getMaxX` is the frame's right
 *  border plus this (`:988-990`). */
export const FRAME_EXTERNAL_MARGIN_X2 = 9;

/** What measuring a frame's text needs: the measurer and the sprites. */
export interface TextEnv {
  readonly measurer: StringMeasurer;
  readonly sprites?: SpriteRegistry | undefined;
}

/** A frame's two paints: its body (`style`) and its header (`styleHeader`). */
export interface FramePaints {
  readonly paint: SequencePaint;
  readonly headerPaint: SequencePaint;
}

/**
 * A `COLORS` capture as the command resolves it -- `colorSet.getColor(color)`,
 * `null` where none was written (`CommandGrouping.java:132-133,161-165`;
 * `CommandReferenceOverSeveral.java:119`).
 */
export function groupingColor(raw: string | undefined): HColor | undefined {
  return raw === undefined ? undefined : HColorSet.instance().getColor(raw);
}

/**
 * `GroupingStart#getUsedStyles` (`GroupingStart.java:63-69`,
 * `Grouping.java:98-102`): the body style with the general colour as its
 * `BackGroundColor`, the header (`groupHeader` under the nested
 * `group { header }`, `Grouping.java:83-96`) with the element colour.
 */
export function groupingPaints(event: FrameEvent): FramePaints {
  const set = HColorSet.instance();
  const builder = event.styleBuilder;
  return {
    paint: paintOf(groupingStyle(builder, 'START', false, groupingColor(event.backColorGeneral)), set),
    headerPaint: paintOf(groupingStyle(builder, 'START', true, groupingColor(event.backColorElement)), set),
  };
}

/** `HColor#toSvg` of a transparent colour (`HColor.java:76`): the bridge
 *  reads a transparent font colour as `null` (`FontConfigurationBridge.ts`). */

/**
 * What a frame text block's creole needs to draw a `<$sprite>` (unwind2-S9b):
 * the sprites and the text's own `FontColor`, which `AtomSprite` tints a
 * monochrome sprite by (`StripeSimple.java:228-235`). `ComponentRoseGroupingHeader
 * #drawInternalU` fills the corner through a DERIVED `ug` (`:142`) and draws
 * the text on one that never had a back applied (`:144,151`), so there is
 * none -- jar-verified white on `tests/fixtures/unwind2-S7/s-group.svg`.
 */
export function atomsOf(paint: SequencePaint, ctx: TextEnv): SequenceAtomContext | undefined {
  return sequenceAtomContext(ctx.sprites, paint.font.color ?? TRANSPARENT_SVG);
}

/** A creole line's total advance: its LAST run's right edge, never a sum of
 *  widths -- a non-text atom advances x without producing a run. */
function creoleLineWidth(runs: readonly TextRun[]): number {
  const last = runs.at(-1);
  return last === undefined ? 0 : last.x + last.textWidth;
}

/** The header tab's fields `FrameGeo` carries. */
export interface HeaderTab {
  readonly tabText: string;
  readonly tabComment?: string;
  readonly tabTextWidth: number;
  readonly tabWidth: number;
  readonly tabHeight: number;
}

/**
 * The title's display lines. An empty title (`group [c]`, whose rewritten
 * title is `""`) is a `TextBlockEmpty`, no line at all
 * (`AbstractTextualComponent.java:87-88`), so its tab is its padding alone.
 */
function titleLinesOf(tabText: string): readonly string[] {
  return tabText === '' ? [] : displayLines(tabText);
}

/**
 * The header tab's `Display`, split by `groupingHeaderDisplay`
 * (`GroupingTile.java:127-128`), then measured at `styleHeader`'s font --
 * `ComponentRoseGroupingHeader.java:107-123` / `AbstractTextualComponent
 * .java:100-114`, with `getSuppHeightForComment` and `commentMargin * 2`
 * both 0. An empty `branchLabels[0]` is "no comment", as `groupingCommand`
 * defaults a conditionless frame's label to `''`.
 */
export function computeHeaderTab(event: FrameEvent, headerPaint: SequencePaint, ctx: TextEnv): HeaderTab {
  const rawComment = event.branchLabels[0];
  const comment = rawComment === undefined || rawComment === '' ? undefined : rawComment;
  // `start.getTitle()`: the rewritten `group T [c]` title, else the keyword.
  const { tabText, tabComment } = groupingHeaderDisplay(event.title ?? event.frameType, comment);
  const font = headerPaint.font;
  // `getPureTextWidth`/`getTextHeight` over the title's own text BLOCK; the
  // corner is drawn at exactly those (`ComponentRoseGroupingHeader.java:
  // 138-142`), so the tab grows with the TITLE's escaped newlines, never with
  // the comment beside it. C5: at the title's own CREOLE width --
  // `groupingHeaderDisplay` makes a `group`'s comment its TITLE.
  const titleLines = titleLinesOf(tabText);
  const measured = ctx.measurer.measure(tabText, atomFontSpec(font));
  const atoms = atomsOf(headerPaint, ctx);
  const tabTextWidth = Math.max(
    0,
    ...titleLines.map((l) =>
      creoleLineWidth(sequenceCreoleRuns(l, font, { leftX: 0, baselineY: 0 }, ctx.measurer, atoms)),
    ),
  );
  const tabWidth = HEADER_PADDING.left + tabTextWidth + HEADER_PADDING.right;
  const tabHeight = titleLines.length * measured.height + HEADER_PADDING.top + HEADER_PADDING.bottom;
  return { tabText, ...(tabComment !== undefined ? { tabComment } : {}), tabTextWidth, tabWidth, tabHeight };
}

/**
 * The header tab's title and its optional `[comment]`, as placed and measured
 * runs (A4), one run per creole atom (C5). Two text blocks at two styles:
 * the title at `styleHeader`'s font and alignment, drawn at
 * `(getOldPaddingX1(), getOldPaddingY())` (`ComponentRoseGroupingHeader
 * .java:151`); the comment at `style`'s `smallFont2`, LEFT, at
 * `(getOldPaddingX1() + textWidth, getOldPaddingY() + 1)` (`:84,89-90,
 * 153-158`), the brackets wrapping the whole block. Jar-verified on
 * `bepipo-37-fego336` (`loop` x=28, `[forever]` x=97.619) and on
 * `cedeti-10-bufu072` (a url inside the comment).
 */
export function buildTabRuns(tab: HeaderTab, paints: FramePaints, x: number, y: number, ctx: TextEnv) {
  const left = x + HEADER_PADDING.left;
  const top = y + HEADER_PADDING.top;
  const { headerPaint, paint } = paints;
  const title = alignedBlockRuns(titleLinesOf(tab.tabText), headerPaint.font, { leftX: left, top }, headerPaint.align, {
    measurer: ctx.measurer,
    atoms: atomsOf(headerPaint, ctx),
  }).runs;
  if (tab.tabComment === undefined) return title;
  const commentAt = { leftX: left + tab.tabWidth, top: top + 1 };
  const comment = alignedBlockRuns(
    displayLines(`[${tab.tabComment}]`),
    paint.font,
    commentAt,
    HorizontalAlignment.LEFT,
    { measurer: ctx.measurer, atoms: atomsOf(paint, ctx) },
  ).runs;
  return [...title, ...comment];
}

/**
 * The header component's preferred width (`GroupingTile.java:216`,
 * `ComponentRoseGroupingHeader#getPreferredWidth:108-119`): `getTextWidth`,
 * the tab, plus -- with a comment -- `getOldPaddingX1() + commentMargin (0) +`
 * the `[comment]` block's width, at `style`'s font (`:84,89-90`).
 */
export function headerWidth(tab: HeaderTab, paint: SequencePaint, ctx: TextEnv): number {
  if (tab.tabComment === undefined) return tab.tabWidth;
  const comment = alignedBlockRuns(
    displayLines(`[${tab.tabComment}]`),
    paint.font,
    { leftX: 0, top: 0 },
    HorizontalAlignment.LEFT,
    { measurer: ctx.measurer, atoms: atomsOf(paint, ctx) },
  );
  return tab.tabWidth + HEADER_PADDING.left + comment.width;
}

/**
 * A group's header component width, `getPreferredDimensionIfEmpty().getWidth()`
 * (`GroupingTile.java:257-259`), for a reader outside the walk: the participant
 * row's frame clearance (`ensureClearsTitleOf`, `:663-665`).
 */
export function groupHeaderWidth(event: FrameEvent, env: TextEnv): number {
  const paints = groupingPaints(event);
  return headerWidth(computeHeaderTab(event, paints.headerPaint, env), paints.paint, env);
}

/**
 * The style `ElseTile#getComponent` hands `ComponentRoseGroupingElse`
 * (`ElseTile.java:92-101`): the leaf's `getUsedStyles()[0]`, merged from its
 * own builder, its `BackGroundColor` its own general colour or the opener's
 * (`GroupingLeaf.java:63-69`).
 */
export function elsePaint(event: FrameEvent, index: number): SequencePaint {
  const builder = event.branchStyleBuilders[index] ?? event.styleBuilder;
  const back = groupingColor(event.branchColors?.[index] ?? event.backColorGeneral);
  return paintOf(groupingStyle(builder, 'ELSE', false, back), HColorSet.instance());
}

/** `ComponentRoseGroupingElse`'s own padding, `topRightBottomLeft(1, 5, 1, 5)`
 *  (`:65-67`) — left and top respectively. */
export const ELSE_PADDING_X1 = 5;

/** The `else` component's text: `"[" + comment + "]"` through
 *  `Display.getWithNewlines` (`ComponentRoseGroupingElse.java:65-66`,
 *  `AbstractTextualComponent.java:60-63`); none for a bare `else`. */
export function conditionLines(label: string): readonly string[] {
  const condition = label.trim();
  return condition === '' ? [] : displayLines(`[${condition}]`);
}

/** `ComponentRoseGroupingElse`'s right padding, the `5` of
 *  `topRightBottomLeft(1, 5, 1, 5)` (`:65-67`). */
const ELSE_PADDING_X2 = 5;

/**
 * The else component's preferred width, `getTextWidth` (`ComponentRoseGroupingElse
 * .java:124-126`): the condition block plus both paddings
 * (`AbstractTextualComponent.java:106-108`). A bare `else` has no block, so
 * its width is the paddings alone. `ElseTile#getMaxX` is the group's
 * `getMinX` plus this (`ElseTile.java:157-161`).
 */
export function elseComponentWidth(label: string, paint: SequencePaint, ctx: TextEnv): number {
  const block = alignedBlockRuns(conditionLines(label), paint.font, { leftX: 0, top: 0 }, paint.align, {
    measurer: ctx.measurer,
    atoms: atomsOf(paint, ctx),
  });
  return block.width + ELSE_PADDING_X1 + ELSE_PADDING_X2;
}
