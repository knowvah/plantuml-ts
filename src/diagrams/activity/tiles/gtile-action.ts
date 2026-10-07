import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';
import type { StringBounder } from './tile.js';
import type { ActivityAction } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import { activityBoxHeight, activityFontSize, activityPadding } from '../activity-style-defaults.js';
import { activityMinimumWidth } from '../activity-text-style.js';
import { creoleTextLines } from '../../../core/svek/image/creole-text-lines.js';
import type { StringMeasurer, FontSpec } from '../../../core/measurer.js';
import { isTableRowLine, tableRowCellsOf } from '../activity-text-placement.js';
import { buildActionTextBlock, klimtStringBounder, isActionSheetEligible } from '../activity-creole-sheet.js';

/** `AtomText#calculateDimensionSlow`'s own floor (`AtomText.java:179-181`,
 *  `if (h < 10) h = 10`), applied to every creole text atom -- including
 *  the single-run, uniform-font-size case every action-box physical line
 *  reduces to, since this port's `StringBounderFromWidthTable`-equivalent
 *  (`WidthTableMeasurer`) returns `height === fontSize` unconditionally
 *  (`klimt/drawing/font/StringBounderFromWidthTable.java:71`, this file's
 *  own `lineHeight` comment below). add3-T2b pass 2 (D5/KLIMT-FLOOR):
 *  `gtile-action.ts`'s own per-line height never carried this floor, so a
 *  small custom `activityFontSize` (`loxija-71-joku558`/`zepima-96-
 *  peco612`, both `skinparam activityFontSize 4`) sized the box 6px
 *  shorter per line than every text atom inside it actually occupies --
 *  jar-verified: the box `rect/@height` is a flat `+6` per line short
 *  (24 vs 30 for a 1-line box, growing by `+6` per additional line) across
 *  both fixtures. Exported so `activity-renderer-shapes.ts` applies the
 *  IDENTICAL floor to the per-line Y-advance (CLAUDE.md's "a layout
 *  constant a renderer also needs is exported from the layout module and
 *  imported, never redeclared"), not just this sizer. */
export const ACTION_TEXT_MIN_HEIGHT = 10;

/** `AtomText.java:179-181`'s floor ({@link ACTION_TEXT_MIN_HEIGHT}),
 *  applied to a raw per-line height. */
export function floorActionLineHeight(rawHeight: number): number {
  return Math.max(rawHeight, ACTION_TEXT_MIN_HEIGHT);
}

/**
 * add3-T2b pass 3 (STRIPE): a bare `----`/`====`/`....` separator line
 * (`CreoleStripeSimpleParser.ts#classifyStripeLine`'s `HORIZONTAL_LINE`,
 * `CreoleStripeSimpleParser.java:92-109`) is drawn by `StripeSimple
 * #analyzeAndAdd` (java:149-155) as `atoms.add(CreoleHorizontalLine
 * .create(fontConfiguration, line, style.getStyle(), skinParam))` --
 * `CreoleHorizontalLine` is the REAL atom this port's `StripeSimple.ts`
 * ALSO instantiates for this classification (confirmed: it is the one
 * class both engines import for it). Its own `calculateDimensionSlow`
 * (`CreoleHorizontalLine.java:118-129`) returns a FLAT `new
 * XDimension2D(10, 10)` for every bare separator -- `this.line.length
 * === 0` is true for all three styles, since none of the bare patterns
 * (`SECTION_SEPARATOR_PATTERN` etc.) ever capture a label. `10`,
 * NOT `creole-text-lines.ts#CREOLE_HR_HEIGHT` (`= 8`,
 * `leaf-sizing-text.ts:43`) -- that constant is independently oracle-
 * verified too, but against a DIFFERENT class entirely: a `node x [ … ]`
 * description-leaf BODY (`leaf-sizing-text.ts`'s own module doc comment:
 * "the FULL Sheet/SheetBlock1 pipeline is too large to port... this seam
 * builds on the pieces this port ALREADY has" -- i.e. it does NOT
 * instantiate `CreoleHorizontalLine` at all). Re-verified this pass by
 * rendering `node x [\nfoo1\n====\nfoo2\n]` through `scripts/oracle-
 * render.sh`: the entity's own box spans `y=7` to `y=73` (height 66,
 * EXACTLY the `14+8+14+30margin` the constant's own doc comment cites) --
 * a real, independently-correct value for ITS class, not a typo. Two
 * different upstream classes, two different real heights; this constant
 * is `CreoleHorizontalLine`'s, re-derived locally rather than overloading
 * the OTHER seam's (this port's own per-layer convention for a jar
 * constant, matching `ACTION_TEXT_MIN_HEIGHT`'s own precedent above).
 * `bigide-91-bise382`'s own golden confirms it algebraically: box2
 * (`:first part\n====\nsecond part;`) height 54 = 12(text) + 12(text) +
 * 10(HR) + 20(2x padding) -- box1 (`:first part\n____\nsecond part;`,
 * `____` is LITERAL, not HR, confirmed by the SAME golden's `<text>
 * ____</text>`) height 56 = 12+12+12+20, matching ours exactly already.
 */
export const ACTIVITY_HR_HEIGHT = 10;

/** `StripeTable.java:82`: `new AtomWithMargin(table, 2, 2)` -- the merged
 *  creole table's own +2-top/+2-bottom margin, added ONCE per `FtileBox`
 *  whose entire label is a single `StripeTable` stripe (this task's two
 *  assigned rows, `activity-creole-table`/`niletu-83-lego826`, are both
 *  all-table labels; a label MIXING table and plain-text physical lines
 *  needs per-stripe margin accounting this constructor does not attempt).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomWithMargin.java:49 */
const TABLE_BLOCK_MARGIN_Y = 4;

/** `WidthTableMeasurer`-shaped adapter over this tile's own injected
 *  `StringBounder` (`tile.js`'s `getDimension(text, fontSizePt)`) -- the
 *  seam `creoleTextLines` needs ({@link StringMeasurer}'s
 *  `measure(text, font)`) is a different, wider shape. `getDescent`'s
 *  `size/4.5` is `StringBounder.java:47`'s own documented default, already
 *  cited by `activity-renderer-shapes.ts#ASCENT_FRACTION`; the seam only
 *  reads it for a `<back:gradient>` patch no row this task owns reaches. */
export function measurerAdapterOf(bounder: StringBounder): StringMeasurer {
  return {
    measure: (text, font) => bounder.getDimension(text, font.size),
    getDescent: (font) => font.size / 4.5,
  };
}

/**
 * One physical line's content width -- the RESOLVED creole width, not the
 * literal (markup-including) source text: `FtileBox#calculateDimensionFtile`
 * (`ftile/vertical/FtileBox.java:237-243`) sizes the box from the
 * `Display#create8`-built `TextBlock`, i.e. `skinParam.sheet(fc, align,
 * CreoleMode.FULL).createSheet(label)` (`FtileBox.java:178-181`) -- the SAME
 * real lexer (`buildLineAtoms`, `klimt/creole/legacy/StripeSimple.ts`, via
 * `creoleTextLines`) the Sheet's own `SheetBlock1` would measure every
 * stripe through. add3-T2b (D5) widens this from the two pre-existing
 * triggers (a `[[url]]` line, `StripeTable`'s own stripped `|cell|`
 * content, `activity-text-placement.ts#tableRowCellsOf`,
 * `StripeTable.java:137-159`) to EVERY line, so `**bold**`/`__underline__`/
 * a `=heading`/a `____`/`====` horizontal-line stripe
 * (`CreoleStripeSimpleParser.java:92-109,149-153`) all measure through the
 * real classifier instead of as literal markup characters (`vimako-25-
 * mega336`/`fatuzu-07-cevu894`/`bedezo-44-more709`/`pirofe-41-xama594`,
 * census family CREOLE-INLINE). A `HORIZONTAL_LINE` stripe's own `width: 0`
 * (`creole-text-lines.ts`'s `'hr'` kind) correctly never constrains the
 * box -- matching upstream, where the rule spans whatever width the OTHER
 * lines already settled on, not the reverse.
 */
function creoleLineWidth(line: string, bounder: StringBounder, theme: Theme, fontSize: number): number {
  if (isTableRowLine(line)) {
    return tableRowCellsOf(line).reduce((sum, cell) => sum + bounder.getDimension(cell, fontSize).width, 0);
  }
  const font: FontSpec = { family: theme.fontFamily, size: fontSize };
  const built = creoleTextLines(line, font, measurerAdapterOf(bounder));
  return built[0]?.width ?? 0;
}

/**
 * One physical line's REAL height -- `CreoleStripeSimpleParser.java
 * :149-153`'s heading cascade (`StripeSimple.ts#fontConfigurationForHeading`,
 * a `=heading` line grows both bold AND size) and `AtomText.java:179-181`'s
 * floor both flow through the SAME `creoleTextLines` call {@link
 * creoleLineWidth} already makes, mirrored here for height -- add3-T2b
 * pass 2 (KLIMT-ACT): `gtile-action.ts`'s own per-line height used to be
 * ONE uniform {@link floorActionLineHeight} value for every line, so a
 * `=condition1` heading line (bold + `+4`pt, `jagove-43-nako107`) measured
 * 4px SHORT -- jar-verified: the box's own `rect/@height` is a flat `-4`
 * (56 vs 60) for every one of its three `:=condN\n...\noperation...;`
 * action boxes. `fallback` is the caller's own uniform floored height,
 * covering the table-row/blank-physical-line cases this function does not
 * itself classify (table rows keep their EXISTING uniform-height
 * treatment, matching `StripeTable`'s own fixed row height, not a creole-
 * cascaded one).
 */
function creoleLineHeight(line: string, bounder: StringBounder, theme: Theme, fontSize: number, fallback: number): number {
  if (isTableRowLine(line)) return fallback;
  const font: FontSpec = { family: theme.fontFamily, size: fontSize };
  const built = creoleTextLines(line, font, measurerAdapterOf(bounder));
  if (built[0] === undefined) return fallback;
  return built[0].kind === 'hr' ? ACTIVITY_HR_HEIGHT : built[0].height;
}

/**
 * add3-T2b pass 3 (D5 Sheet spike): `FtileBox.java:178-181`'s own
 * `SheetBlock1`, built for a label with no table row and no `<code>`
 * block (both pre-existing, unchanged special cases -- the Sheet spike
 * is scoped to plain creole text, matching `activity-creole-sheet.ts`'s
 * own doc comment). `tb.calculateDimension` already includes `skinParam
 * .getPadding()` (`activityPadding('activity')`, `SheetBlock1`'s own
 * constructor arg) -- the caller must NOT add padding again. `null`
 * when the label is empty (`Display.create([''])`'s own `isNull`
 * short-circuit reports a zero-height sheet, not the `textHeight=0`
 * this port's OWN formula already handles via `lines.length===0`'s
 * `Math.max()` of an empty array -- deferred to the pre-existing path).
 */
function sheetDimension(
  label: string,
  bounder: StringBounder,
  theme: Theme,
  fontSize: number,
): { width: number; height: number } | null {
  if (label === '' || !isActionSheetEligible(label, theme)) return null;
  const sheetBounder = klimtStringBounder(measurerAdapterOf(bounder), { family: theme.fontFamily, size: fontSize });
  const dim = buildActionTextBlock(label, theme, fontSize, 'activity').calculateDimension(sheetBounder);
  return { width: dim.getWidth(), height: dim.getHeight() };
}

/** `label.split('\n')`, `<code>` detection, and the table-row scan --
 *  split out so {@link computeActionSize} stays under the per-function
 *  complexity ceiling. */
interface ActionLines {
  readonly lines: readonly string[];
  readonly isCodeBlock: boolean;
  readonly hasTableRow: boolean;
}

function classifyActionLines(label: string): ActionLines {
  // Strip <code>/<\/code> wrapper lines — they are not rendered as content.
  const allLines = label.split('\n');
  const isCodeBlock = /^<code>$/i.test(allLines[0]?.trim() ?? '');
  const lines = allLines.filter((l) => !/^<\/?code>$/i.test(l.trim()));
  return { lines, isCodeBlock, hasTableRow: lines.some((l) => isTableRowLine(l)) };
}

/** The per-line measurement context both {@link actionWidth} and
 *  {@link actionHeight} need -- bundled to stay within this project's
 *  5-param ceiling. */
interface ActionSizeCtx {
  readonly bounder: StringBounder;
  readonly theme: Theme;
  readonly fontSize: number;
  readonly lineHeight: number;
}

/** `FtileBox#calculateDimensionFtile` (`ftile/vertical/FtileBox.java
 *  :237-243`) adds Padding to both axes and floors the WIDTH only via
 *  `dimRaw.atLeast(minimumWidth, 0)`; `minimumWidth` resolves through
 *  the shared `<style>`/`skinparam minClassWidth` cascade
 *  (`activityMinimumWidth`, D1), whose own unset default is 0
 *  (`style/ValueNull.java:61-63`). `sheetWidth` (D5 Sheet spike,
 *  {@link sheetDimension}) already includes padding -- must NOT add it
 *  twice. */
function actionWidth(classified: ActionLines, sheetWidth: number | undefined, ctx: ActionSizeCtx): number {
  if (sheetWidth !== undefined) return Math.max(sheetWidth, activityMinimumWidth(ctx.theme));
  const { lines, isCodeBlock } = classified;
  // Monospace chars are ~0.6× fontSize wide; proportional bounder underestimates
  // indented code lines because space glyphs are narrower than code chars.
  const monoCharWidth = ctx.fontSize * 0.6;
  const maxWidth = isCodeBlock
    ? Math.max(0, ...lines.map((l) => l.length * monoCharWidth))
    : Math.max(...lines.map((l) => creoleLineWidth(l, ctx.bounder, ctx.theme, ctx.fontSize)));
  // add3-T3f (PADDING): this is the `<code>`/table-row fallback that never
  // reaches `sheetDimension` -- it still passes through the SAME real
  // `FtileBox`/`SheetBlock1` upstream, so the bare `skinparam padding N`
  // key (`theme-root-fields.ts#padding`) must land here too.
  return Math.max(
    maxWidth + 2 * activityPadding('activity') + 2 * (ctx.theme.padding ?? 0),
    activityMinimumWidth(ctx.theme),
  );
}

/** No upstream minimum height (the port's old `ACTION_HEIGHT = 36` floor
 *  stays deleted, D8). `sheetHeight` (D5 Sheet spike) already includes
 *  padding and the real per-line/heading/HR cascade -- returned as-is. */
function actionHeight(classified: ActionLines, sheetHeight: number | undefined, ctx: ActionSizeCtx): number {
  if (sheetHeight !== undefined) return sheetHeight;
  const { lines, isCodeBlock } = classified;
  // `StripeTable.java:82`'s `AtomWithMargin(table, 2, 2)` -- see
  // `TABLE_BLOCK_MARGIN_Y`'s own doc comment for the all-table-lines scope.
  const isAllTableRows = !isCodeBlock && lines.length > 0 && lines.every((l) => isTableRowLine(l));
  const textHeight =
    isAllTableRows || isCodeBlock
      ? ctx.lineHeight * lines.length + (isAllTableRows ? TABLE_BLOCK_MARGIN_Y : 0)
      : lines.reduce((sum, l) => sum + creoleLineHeight(l, ctx.bounder, ctx.theme, ctx.fontSize, ctx.lineHeight), 0);
  // add3-T3f (PADDING): same fallback-path note as `actionWidth` above.
  return activityBoxHeight(textHeight, 'activity') + 2 * (ctx.theme.padding ?? 0);
}

/** `GtileAction`'s width/height. */
function computeActionSize(label: string, bounder: StringBounder, theme: Theme): { width: number; height: number } {
  const classified = classifyActionLines(label);
  // `activityDiagram { activity { FontSize 12 } }` (plantuml.skin:361).
  const fontSize = activityFontSize(theme, 'activity');
  // `calculateDimension`'s returned height is `size`, unconditionally --
  // `klimt/drawing/font/StringBounderFromWidthTable.java:71`.
  const lineHeight = floorActionLineHeight(bounder.getDimension('M', fontSize).height);
  const ctx: ActionSizeCtx = { bounder, theme, fontSize, lineHeight };
  const sheet =
    classified.isCodeBlock || classified.hasTableRow ? null : sheetDimension(label, bounder, theme, fontSize);
  return {
    width: actionWidth(classified, sheet?.width, ctx),
    height: actionHeight(classified, sheet?.height, ctx),
  };
}

export class GtileAction extends TileLeaf {
  readonly kind = 'gtile-action' as const;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly color: string | undefined;

  constructor(node: ActivityAction, bounder: StringBounder, theme: Theme) {
    super();
    this.label = node.label;
    this.color = node.color;
    const { width, height } = computeActionSize(node.label, bounder, theme);
    this.width = width;
    this.height = height;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.width / 2, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.width / 2, y: this.height };
      case EAST_HOOK:
        return { x: this.width, y: this.height / 2 };
      case WEST_HOOK:
        return { x: 0, y: this.height / 2 };
      default: {
        const _exhaustive: never = hook;
        /* c8 ignore next */
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * Has an out point: an action box always continues the flow.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBox.java:237-241
   *   -- `calculateDimensionFtile` uses the five-argument `FtileGeometry`
   *   constructor with `outY = dimRaw.getHeight()`.
   */
  hasPointOut(): boolean {
    return true;
  }
}
