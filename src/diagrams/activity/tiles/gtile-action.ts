import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';
import type { StringBounder } from './tile.js';
import type { ActivityAction } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import { activityFontSize } from '../activity-style-defaults.js';
import type { StringMeasurer } from '../../../core/measurer.js';
import { actionBoxDimension, buildActionTextBlock, klimtStringBounder } from '../activity-creole-sheet.js';

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
 * `BoxStyle`'s `shield` per non-PLAIN style (`BoxStyle.java:61-97`), keyed
 * by the stereotype name `BoxStyle.fromString` matches against
 * (`BoxStyle.java:126-133`: `-` removed, case-insensitive -- lowercased
 * here). The faithful home of this table is `ftile/BoxStyle.ts`, whose
 * SDL/UML half is still unported; the outlines live in
 * `activity-renderer-signal-shapes.ts`.
 */
const BOX_STYLE_SHIELDS: Readonly<Record<string, number>> = {
  input: 10, // java:61
  output: 10, // java:64
  procedure: 0, // java:67
  load: 0, // java:70
  save: 0, // java:73
  continuous: 0, // java:76
  task: 0, // java:79
  object: 0, // java:82
  objectsignal: 10, // java:85
  trigger: 10, // java:88
  sendsignal: 10, // java:91
  acceptevent: 10, // java:94
  timeevent: 10, // java:97
};

/** `BoxStyle.fromString(stereotype)` (`BoxStyle.java:126-133`): the style's
 *  lowercase name, or `undefined` for `PLAIN`. */
export function boxStyleName(stereotype: string | undefined): string | undefined {
  if (stereotype === undefined) return undefined;
  const key = stereotype.replaceAll('-', '').toLowerCase();
  return Object.hasOwn(BOX_STYLE_SHIELDS, key) ? key : undefined;
}

/** `BoxStyle#getShield` (`BoxStyle.java:122-124`); `PLAIN` is 0 (`:58`). */
export function boxStyleShield(stereotype: string | undefined): number {
  const name = boxStyleName(stereotype);
  return name === undefined ? 0 : BOX_STYLE_SHIELDS[name]!;
}

/**
 * `GtileAction`'s width/height: `FtileBox#calculateDimensionFtile`
 * (`FtileBox.java:236-243`) over the box's own Sheet text block
 * (`activity-creole-sheet.ts#buildActionTextBlock`, `FtileBox.java:178-181`)
 * -- every label, creole tables, separators, `[[url]]`s, `{{ }}` embeds and
 * `<code>` blocks (a `StripeCode` stripe, `CreoleParser.java:103-104`)
 * included, measured through the caller's own `StringBounder`.
 */
function computeActionSize(label: string, bounder: StringBounder, theme: Theme): { width: number; height: number } {
  // `activityDiagram { activity { FontSize 12 } }` (plantuml.skin:361).
  const fontSize = activityFontSize(theme, 'activity');
  const sheetBounder = klimtStringBounder(measurerAdapterOf(bounder), { family: theme.fontFamily, size: fontSize });
  return actionBoxDimension(buildActionTextBlock(label, theme, fontSize, 'activity'), sheetBounder, theme, 'activity');
}

/** `FtileBox#calculateDimensionFtile` (`FtileBox.java:241-242`): the box is
 *  `dimRaw.width + boxStyle.getShield()` wide, but its in/out `left` stays
 *  `dimRaw.width / 2` -- the shield is extra width to the RIGHT of the
 *  hooks. */
function hookX(width: number, shield: number): number {
  return (width - shield) / 2;
}

export class GtileAction extends TileLeaf {
  readonly kind = 'gtile-action' as const;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly color: string | undefined;
  /** The action's stereotype -- its `BoxStyle` ({@link boxStyleName}). */
  readonly stereotype: string | undefined;
  /** {@link boxStyleShield}. */
  readonly shield: number;

  constructor(node: ActivityAction, bounder: StringBounder, theme: Theme) {
    super();
    this.label = node.label;
    this.color = node.color;
    this.stereotype = node.stereotype;
    this.shield = boxStyleShield(node.stereotype);
    const { width, height } = computeActionSize(node.label, bounder, theme);
    this.width = width + this.shield;
    this.height = height;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: hookX(this.width, this.shield), y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: hookX(this.width, this.shield), y: this.height };
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
