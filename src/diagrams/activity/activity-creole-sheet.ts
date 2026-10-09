/**
 * activity-creole-sheet -- every action and note label drawn through the
 * REAL `SheetBuilder -> SheetBlock1 -> SheetBlock2 -> stripes/atoms`
 * pipeline upstream builds them with: `FtileBox.java:178-181` for the
 * action box (`new SheetBlock2(new SheetBlock1(sheet, wrapWidth,
 * skinParam.getPadding()), new MyStencil(), UStroke.withThickness(1))`),
 * `FtileWithNotes.java:122-130` for a note. The box/Opale outline itself is
 * drawn by the caller (`activity-renderer-shapes.ts`); this module draws the
 * text block inside it, creole tables, `----` separators, `[[url]]`s and
 * `{{ }}` embeds included -- no label takes a separate per-line path.
 *
 * `ISkinSimple` is the minimal surface `CreoleParser`/`StripeSimple`
 * actually read for a label -- modeled on
 * `EntityImageDescriptionDelegates.ts#buildLocalSkinSimple`'s own
 * member-by-member `SkinParam.java` defaults (empty md5 map, identity
 * size hack, `MONOSPACED` family, tabsize 8, dpi 96). `chromeAtomOps`
 * (`core/annotations/blocks-creole.ts`) is the shared, generic `AtomOps`
 * every engine's Sheet already uses (sprites/images/emoji/plain text) --
 * reused directly, matching mindmap's own `SkinParam` precedent
 * (`mindmap-skin-param.ts`).
 *
 * `klimtStringBounder` replicates `UGraphicSvg.ts#getStringBounder()`'s
 * own closure rather than building a throwaway `UGraphicSvg` just to
 * extract it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBox.java:178-181
 */
import type { Theme } from '../../core/theme.js';
import type { ActivitySName } from './activity-style-defaults.js';
import {
  activityFontColor,
  activityFontFamily,
  activityHyperlinkColor,
  activityWrapWidth,
} from './activity-text-style.js';
import {
  activityHorizontalAlignment,
  activityMinimumWidth,
  activityNoteHorizontalAlignment,
} from './activity-text-style.js';
import { activityPadding, activityFontSize, activityLineThickness } from './activity-style-defaults.js';
import { actColors } from './activity-renderer-shapes.js';
import { NOTE_MARGIN_X1, NOTE_MARGIN_X2, NOTE_MARGIN_Y } from './activity-layout-constants.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { SheetBlock1 } from '../../core/klimt/creole/SheetBlock1.js';
import { SheetBlock2 } from '../../core/klimt/creole/SheetBlock2.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Fore } from '../../core/klimt/Fore.js';
import type { UChange } from '../../core/klimt/UChange.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { chromeAtomOps } from '../../core/annotations/blocks-creole.js';
import { GUILLEMET_DEFAULT } from '../../core/text/Guillemet.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { MONOSPACED } from '../../core/klimt/creole/Parser.js';
import { getNestedDiagramRenderer } from '../../core/nested-diagram-registry.js';
import type { NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { ISkinSimple } from '../../core/style/ISkinSimple.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { extractFlatContent } from '../../core/klimt/document-shell-fragment.js';
import { activityMeasurer } from './activity-string-bounder.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import type { Sheet } from '../../core/klimt/creole/Sheet.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import { getSprite, type SpriteRegistry } from '../../core/sprite-registry.js';
import { Back } from '../../core/klimt/Back.js';
import type { Paint } from '../../core/paint.js';

/** `$version$` -- the placeholder version for the throwaway `UGraphicSvg`
 *  each draw below renders into. */
const THROWAWAY_VERSION = '$version$';

const ALIGNMENT_MAP: Record<'left' | 'center' | 'right', HorizontalAlignment> = {
  left: HorizontalAlignment.LEFT,
  center: HorizontalAlignment.CENTER,
  right: HorizontalAlignment.RIGHT,
};

/** `{{ }}` inside an action label -- registered globally
 *  (`src/index.ts:383`, the SAME registry mindmap's own `nestedRenderer()`
 *  reads), absent only when nothing registered one (a unit test). */
function nestedRenderer(): NestedDiagramRenderer {
  return (
    getNestedDiagramRenderer() ?? {
      render(): TextBlock {
        throw new Error('activity: no nested-diagram renderer is registered');
      },
    }
  );
}

/** See module doc comment. `getSprite` is `SkinParam#getSprite`
 *  (`SkinParam.java:811-817`) over the diagram's own map (`Theme#sprites`),
 *  which `StripeSimple#addSprite` reads (`StripeSimple.java:229`). */
function activitySkinSimple(fontConfiguration: FontConfiguration, sprites: SpriteRegistry | undefined): ISkinSimple {
  const atomOps = chromeAtomOps(sprites, fontConfiguration);
  const pragma = Pragma.createEmpty();
  const skin: ISkinSimple = {
    getSprite: (name: string) => (sprites === undefined ? null : (getSprite(sprites, name) ?? null)),
    guillemet: () => GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s: string) => s,
    getValue: () => null,
    values: () => new Map<string, string>(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(),
    getMonospacedFamily: () => MONOSPACED,
    getTabSize: () => 8,
    getDpi: () => 96,
    copyAllFrom: () => undefined,
    getPragma: () => pragma,
    sheet: (fc, align, mode, stereo?: FontConfiguration) =>
      new CreoleParser(
        fc,
        align,
        skin,
        { creoleMode: mode, stereotype: stereo ?? fc },
        { atomOps, renderer: nestedRenderer() },
      ),
  };
  return skin;
}

/** `UGraphicSvg.ts#getStringBounder()`'s own closure, replicated rather
 *  than built via a throwaway `UGraphicSvg` -- see module doc comment. */
export function klimtStringBounder(measurer: StringMeasurer, font: FontSpec): StringBounder {
  return {
    calculateDimension(fc, text) {
      const dim = measurer.measure(text, { ...font, size: fc.size });
      return new XDimension2D(dim.width, dim.height);
    },
    getDescent(fc, text) {
      return measurer.getDescent({ ...font, size: fc.size }, text);
    },
  };
}

/** `style.getFontConfiguration(set)` (`Style.java:259-268`) for one activity
 *  SName: family/size/colour plus the hyperlink colour (`PName.HyperLinkColor`)
 *  and `skinParam.useUnderlineForHyperlink()` (`SkinParam.java:1057-1060`)
 *  that `FontConfiguration#hyperlink()` (`FontConfiguration.java:335-340`)
 *  reads for a `[[url]]` run. */
function activityFontConfiguration(theme: Theme, fontSize: number, sname: ActivitySName): FontConfiguration {
  const hyperlinkColor = activityHyperlinkColor(theme, sname);
  return {
    family: activityFontFamily(theme, sname),
    size: fontSize,
    color: activityFontColor(theme, sname),
    styles: new Set(),
    ...(hyperlinkColor === undefined ? {} : { hyperlinkColor }),
    ...(theme.hyperlinkUnderline === false ? { hyperlinkUnderlineStroke: null } : {}),
  };
}

/** `skinParam.sheet(fc, align, CreoleMode.FULL).createSheet(label)`
 *  (`FtileBox.java:178-179`, `FtileWithNoteOpale.java:147-148`). `SheetBuilder
 *  #createSheet` returns `Sheet<StripeAtom>`; `SheetBlock1` wants
 *  `Sheet<CreoleAtom>` -- the SAME type gap `DisplayCreole.ts#getCreole` casts
 *  through. */
function createSheet(
  text: string,
  fc: FontConfiguration,
  align: HorizontalAlignment,
  sprites: SpriteRegistry | undefined,
): Sheet<CreoleAtom> {
  return activitySkinSimple(fc, sprites)
    .sheet(fc, align, CreoleMode.FULL)
    .createSheet(Display.create(text.split('\n'))) as unknown as Sheet<CreoleAtom>;
}

/**
 * `FtileBox`'s own text block (`FtileBox.java:178-181`): `new SheetBlock2(new
 * SheetBlock1(sheet, wrapWidth, skinParam.getPadding()), new MyStencil(),
 * UStroke.withThickness(1))`. `SheetBlock1`'s padding is the BARE `skinparam
 * padding N` key (`SkinParam.java:1147-1150`, `theme.padding`); the box's own
 * `style.getPadding()` (`activityPadding`) is added OUTSIDE it by
 * {@link actionBoxDimension} and the draw translate (`FtileBox.java:224-243`).
 * `MyStencil` (`FtileBox.java:124-134`) spans `-padding.getLeft()` to the
 * box's own width `- padding.getRight()`, so a creole `----` separator is a
 * `ULine` across the whole box (`UGraphicStencil.java:83`), not a
 * `UHorizontalLine` the SVG driver has no driver for (upstream neither).
 * `shield` is the box's `BoxStyle#getShield` (`BoxStyle.java:122-124`):
 * `MyStencil` reads `FtileBox#calculateDimension`, which includes it
 * (`FtileBox.java:241`).
 */
export function buildActionTextBlock(
  label: string,
  theme: Theme,
  fontSize: number,
  sname: ActivitySName,
  shield = 0,
): SheetBlock2 {
  const fc = activityFontConfiguration(theme, fontSize, sname);
  const sheet = createSheet(label, fc, ALIGNMENT_MAP[activityHorizontalAlignment(theme)], theme.sprites);
  // isw-T2-act F5: `new SheetBlock1(sheet, wrapWidth, ...)`, `wrapWidth =
  // style.wrapWidth()` (`FtileBox.java:175,180`).
  const sheet1 = new SheetBlock1(
    sheet,
    activityWrapWidth(theme, sname),
    chromeAtomOps(theme.sprites, fc),
    theme.padding ?? 0,
  );
  const padding = activityPadding(sname);
  return new SheetBlock2(
    sheet1,
    {
      getStartingX: () => -padding, // FtileBox.java:126-128
      getEndingX: (stringBounder) => actionBoxDimension(sheet1, stringBounder, theme, sname).width + shield - padding, // :130-133
    },
    UStroke.withThickness(1),
  );
}

/** `FtileBox#calculateDimensionFtile` (`FtileBox.java:236-243`): the text
 *  block plus `style.getPadding()` on both axes, the width floored at
 *  `MinimumWidth` (`dimRaw.atLeast(minimumWidth, 0)`). */
export function actionBoxDimension(
  tb: TextBlock,
  stringBounder: StringBounder,
  theme: Theme,
  sname: ActivitySName,
): { width: number; height: number } {
  const dim = tb.calculateDimension(stringBounder);
  const padding = activityPadding(sname);
  return {
    width: Math.max(dim.getWidth() + 2 * padding, activityMinimumWidth(theme)),
    height: dim.getHeight() + 2 * padding,
  };
}

/** `FtileBox#drawU`'s text translate (`FtileBox.java:224-233`): LEFT
 *  `(padding.getLeft(), padding.getTop())`, RIGHT `(dimTotal.width -
 *  dimTb.width - padding.getRight(), padding.getBottom())`, CENTER
 *  `((dimTotal.width - dimTb.width) / 2, padding.getBottom())` -- `padding`
 *  is symmetric here (`activityPadding`), so every branch's `dy` is it. */
function actionTextTranslate(theme: Theme, boxWidth: number, tbWidth: number, padding: number): UTranslate {
  const align = activityHorizontalAlignment(theme);
  if (align === 'right') return new UTranslate(boxWidth - tbWidth - padding, padding);
  if (align === 'center') return new UTranslate((boxWidth - tbWidth) / 2, padding);
  return new UTranslate(padding, padding);
}

/** The ambient `UGraphic` state a text block is drawn under: the
 *  `ug.apply(...)` chain its owner applied before `tb.drawU` (`changes`) and
 *  `SvgOption#withLinkTarget` (`skinparam svgLinkTarget`). */
interface DrawContext {
  readonly theme: Theme;
  readonly font: FontSpec;
  readonly changes: readonly UChange[];
}

/**
 * Draws `tb` at (`x`, `y`) on a throwaway `UGraphicSvg` + `extractFlatContent`
 * -- one throwaway document per whole multi-stripe `TextBlock`. `SvgOption.linkTarget`
 * carries `skinparam svgLinkTarget` (`SkinParam.java:1082`) into every
 * `[[url]]` run's `<a target>` (`UGraphicSvg.java:161`).
 */
export function drawActionTextBlock(tb: TextBlock, x: number, y: number, ctx: DrawContext): string {
  const { font, theme } = ctx;
  const measurer = activityMeasurer(theme);
  const driverBounder = {
    calculateDimension(fc: { readonly size: number }, text: string) {
      return { width: measurer.measure(text, { ...font, size: fc.size }).width };
    },
  };
  const option = basicSvgOption(theme.svgLinkTarget === undefined ? {} : { linkTarget: theme.svgLinkTarget });
  const ug = UGraphicSvg.build(0, option, THROWAWAY_VERSION, driverBounder, measurer);
  tb.drawU(ctx.changes.reduce<UGraphic>((g, c) => g.apply(c), ug.apply(new UTranslate(x, y))));
  return extractFlatContent(ug.getSvgString()).body;
}

/**
 * The `renderAction` entry point: `FtileBox#drawU`'s `tb.drawU(...)`
 * (`FtileBox.java:224-233`) for EVERY action label. `box.width` is the box's
 * own `calculateDimension` width (`dimTotal`), the SAME
 * {@link actionBoxDimension} `gtile-action.ts` sized it with. A `<code>`
 * block is one more stripe of the same Sheet (`StripeCode`,
 * `CreoleParser.java:103-104`), not a separate path.
 */
export function renderActionLabel(
  label: string,
  theme: Theme,
  fontSize: number,
  box: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly shield?: number;
    readonly color?: string;
  },
): string {
  const tb = buildActionTextBlock(label, theme, fontSize, 'activity', box.shield ?? 0);
  const font = { family: activityFontFamily(theme, 'activity'), size: fontSize };
  const tbWidth = tb.calculateDimension(klimtStringBounder(activityMeasurer(theme), font)).getWidth();
  const t = actionTextTranslate(theme, box.width, tbWidth, activityPadding('activity'));
  // `FtileBox#drawU` (`FtileBox.java:205-217`): `ug.apply(borderColor)`, then
  // `ug.apply(style.getStroke())`, before `tb.drawU` -- the ink a stencilled
  // `----` `ULine` is stroked with and the stroke a creole table's grid
  // (`AtomTable#drawU`) inherits.
  // unwind2-S11: `ug.apply(backColor.bg())` (`:215-218`) -- the back a
  // creole `<$sprite>` tints over (`SpriteMonochrome.java:216`).
  const changes = [
    new Fore(actColors(theme).nodeBorder),
    new Back(box.color ?? actColors(theme).nodeFill),
    UStroke.withThickness(activityLineThickness(theme, 'activity')),
  ];
  return drawActionTextBlock(tb, box.x + t.getDx(), box.y + t.getDy(), { theme, font, changes });
}

// ---------------------------------------------------------------------------
// NOTE-CREOLE (add3-T3d): a note label's real creole `TextBlock`,
// `FtileWithNoteOpale.java:147-150` / `FtileNoteAlone.java:114-117` minus
// the `SheetBlock2` clip/border half (`Opale`, `activity-renderer-
// shapes.ts#renderNote`, already draws the note's own fold/polygon body
// separately -- the SAME split {@link buildActionTextBlock}'s own doc
// comment makes for the action box).
// ---------------------------------------------------------------------------

/**
 * `FtileWithNoteOpale.java:147-150`'s own Sheet build for a note's
 * `Display` -- font/colour/size from {@link activityFontFamily}/
 * {@link activityFontColor}/`activityFontSize(theme, 'note')` (sname
 * `'note'`, not `'activity'`), alignment from
 * {@link activityNoteHorizontalAlignment}.
 *
 * `SheetBlock1`'s own `padding` ctor arg stays at its default (`none()`,
 * omitted below) -- unlike {@link buildActionTextBlock}'s
 * `activityPadding('activity')`. Both Java sites pass `skinParam()
 * .getPadding()` into their `SheetBlock1`, but that is `SkinParam
 * #getPadding()` (`skin/SkinParam.java:1147-1150`, the GLOBAL top-level
 * `skinparam padding` key, unset by every corpus fixture -> `none()`) --
 * a DIFFERENT field from `style.getPadding()` (`PName.Padding`, the
 * per-element `activity { Padding 10 }` cascade `activityPadding` models),
 * which `FtileBox` ALSO adds a second time, externally, in its own
 * `calculateDimensionFtile` (`:237-239`) -- the step
 * {@link buildActionTextBlock}'s doc comment folds into one pass via
 * `SheetBlock1`'s padding arg. `FtileWithNoteOpale`/`FtileNoteAlone` have
 * no such second, per-element add at all; `Opale`'s own
 * marginX1(6)/marginX2(15)/marginY(5) (`gtile-note.ts#measureOpaleCreole`,
 * `activity-layout-constants.ts`) are the note box's ONLY additive terms
 * -- confirmed against the ALREADY-PINNED NOTEW family's own formula
 * (`norire-15-taka956` etc.: "text + marginX1 6 + marginX2 15 wide, text +
 * 2*marginY 5 tall", no third padding term).
 */
export function buildNoteTextBlock(text: string, theme: Theme): SheetBlock1 {
  const fc = activityFontConfiguration(theme, activityFontSize(theme, 'note'), 'note');
  const sheet = createSheet(text, fc, ALIGNMENT_MAP[activityNoteHorizontalAlignment(theme)], theme.sprites);
  // isw-T2-act F5: the note style's `wrapWidth()` (`FtileWithNoteOpale.java:143,149`,
  // `FtileNoteAlone.java:109,117`, `FtileWithNotes.java:115,121`).
  return new SheetBlock1(sheet, activityWrapWidth(theme, 'note'), chromeAtomOps(theme.sprites, fc));
}

/**
 * `Opale#getWidth`/`getHeight` (`svek/image/Opale.java:89-96`): the note
 * box's own `textBlock.calculateDimension` plus Opale's fixed margins --
 * `gtile-note.ts#measureOpaleCreole`'s layout-time size.
 */
export function noteTextBlockDimension(
  tb: SheetBlock1,
  sheetBounder: StringBounder,
): { width: number; height: number } {
  const dim = tb.calculateDimension(sheetBounder);
  return { width: dim.getWidth() + NOTE_MARGIN_X1 + NOTE_MARGIN_X2, height: dim.getHeight() + 2 * NOTE_MARGIN_Y };
}

/** `Opale#drawU`'s own `textBlock.drawU(ug.apply(new UTranslate(marginX1,
 *  marginY)))` (`Opale.java:126`) -- unconditional on alignment (CENTER/
 *  RIGHT normalisation happens WITHIN the Sheet's own per-line `Sea`
 *  layout). Every note label is drawn here: the note box is the Opale
 *  `box` the caller already sized (`gtile-note.ts#measureOpaleCreole`), of
 *  which only the origin is read.
 */
export function renderNoteLabel(
  text: string,
  theme: Theme,
  box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  ink: { readonly border: string; readonly fill: Paint },
): string {
  const font = { family: activityFontFamily(theme, 'note'), size: activityFontSize(theme, 'note') };
  const tb = buildNoteTextBlock(text, theme);
  // `Opale#drawU` (`Opale.java:107`): `ug.apply(noteBackgroundColor.bg())
  // .apply(borderColor)` before `textBlock.drawU` -- the colour a stencilled
  // `----` separator line is stroked with, and the back a `<$sprite>` tints
  // over (`SpriteMonochrome.java:216`, unwind2-S11).
  return drawActionTextBlock(noteSheetBlock2(tb), box.x + NOTE_MARGIN_X1, box.y + NOTE_MARGIN_Y, {
    theme,
    font,
    changes: [new Back(ink.fill), new Fore(ink.border)],
  });
}

/**
 * `FtileWithNotes#getNoteTextBlock`'s `new SheetBlock2(sheet1, new
 * Stencil() {...}, UStroke.simple())` (`FtileWithNotes.java:122-130`): the
 * note Sheet is drawn through a stencil spanning `-6` to the sheet's own
 * ending x `+ 15` (Opale's margins), so `SheetBlock2#drawU` wraps the
 * UGraphic in `UGraphicStencil` and a creole `----` separator's
 * `UHorizontalLine` becomes a `ULine` across the note
 * (`UGraphicStencil.java:83`) instead of reaching the SVG driver, which
 * has no `UHorizontalLine` driver (upstream neither).
 */
function noteSheetBlock2(sheet1: SheetBlock1): SheetBlock2 {
  return new SheetBlock2(
    sheet1,
    {
      getStartingX: () => -6, // FtileWithNotes.java:125 ("comes from Opale")
      getEndingX: (stringBounder, y) => sheet1.getEndingX(stringBounder, y) + 15, // FtileWithNotes.java:129
    },
    UStroke.simple(),
  );
}
