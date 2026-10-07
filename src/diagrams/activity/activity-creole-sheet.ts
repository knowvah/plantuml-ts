/**
 * activity-creole-sheet — D5's Sheet spike: an action label's `Display`
 * routed through the REAL `SheetBuilder -> SheetBlock1 -> stripes/atoms`
 * pipeline (`FtileBox.java:178-181`: `skinParam.sheet(fc, align,
 * CreoleMode.FULL).createSheet(label)` -> `new SheetBlock1(sheet,
 * wrapWidth, skinParam.getPadding())`), not `creoleTextLines`'s lighter
 * seam. `SheetBlock2` (the clip+border half `FtileBox.java:179` ALSO
 * wraps with) is intentionally NOT used here: activity's own `rect()`
 * call (`activity-renderer-shapes.ts#renderAction`) already draws the
 * box border separately, so wrapping in a SECOND bordered clip would
 * double-draw it -- this seam is scoped to the TEXT half only.
 *
 * `ISkinSimple` is the minimal surface `CreoleParser`/`StripeSimple`
 * actually read for a plain action label (traced: only `guillemet()`,
 * confirmed by grep across both files) -- modeled on
 * `EntityImageDescriptionDelegates.ts#buildLocalSkinSimple`'s own
 * member-by-member `SkinParam.java` defaults (empty md5 map, identity
 * size hack, `MONOSPACED` family, tabsize 8, dpi 96), the SAME minimal
 * `ISkinSimple` the description engine's own real-Sheet path already
 * uses successfully. `chromeAtomOps` (`core/annotations/blocks-creole.ts`)
 * is the shared, generic `AtomOps` every engine's Sheet already uses
 * (sprites/images/emoji/plain text all dispatch through it) -- reused
 * directly, not reimplemented, matching mindmap's own `SkinParam`
 * precedent (`mindmap-skin-param.ts`).
 *
 * `klimtStringBounder` replicates `UGraphicSvg.ts#getStringBounder()`'s
 * own closure (verified against `mindmap/index.ts#driverBounderFor` +
 * `textBlockDimension`'s identical two-line pattern) rather than
 * building a throwaway `UGraphicSvg` just to extract it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBox.java:178-181
 */
import type { Theme } from '../../core/theme.js';
import type { ActivitySName } from './activity-style-defaults.js';
import { activityFontColor, activityFontFamily } from './activity-text-style.js';
import { activityHorizontalAlignment, activityNoteHorizontalAlignment } from './activity-text-style.js';
import { activityPadding, activityFontSize } from './activity-style-defaults.js';
import { NOTE_MARGIN_X1, NOTE_MARGIN_X2, NOTE_MARGIN_Y } from './activity-layout-constants.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { LineBreakStrategy } from '../../core/klimt/LineBreakStrategy.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { SheetBlock1 } from '../../core/klimt/creole/SheetBlock1.js';
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
import { WidthTableMeasurer } from '../../core/measurer.js';
import { isTableRowLine } from './activity-text-placement.js';
import { classifyStripeLine } from '../../core/klimt/creole/legacy/CreoleStripeSimpleParser.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import type { Sheet } from '../../core/klimt/creole/Sheet.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';

/** `$version$` -- the SAME placeholder literal `activity-renderer-text.ts
 *  #THROWAWAY_VERSION` uses for the identical throwaway-`UGraphicSvg`
 *  purpose. */
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

/** See module doc comment. */
function activitySkinSimple(fontConfiguration: FontConfiguration): ISkinSimple {
  const atomOps = chromeAtomOps(undefined, fontConfiguration);
  const pragma = Pragma.createEmpty();
  const skin: ISkinSimple = {
    getSprite: () => null,
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
      new CreoleParser(fc, align, skin, { creoleMode: mode, stereotype: stereo ?? fc }, { atomOps, renderer: nestedRenderer() }),
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

/**
 * The action label's real creole `TextBlock` -- `FtileBox.java:178-181`
 * minus the `SheetBlock2` clip/border half (module doc comment). `align`
 * is the SAME `activityHorizontalAlignment` the pre-existing per-line `x`
 * math already resolves (`activity-text-placement.ts#boxLineX`).
 */
export function buildActionTextBlock(label: string, theme: Theme, fontSize: number, sname: ActivitySName): SheetBlock1 {
  const fc: FontConfiguration = {
    family: activityFontFamily(theme, sname),
    size: fontSize,
    color: activityFontColor(theme, sname),
    styles: new Set(),
  };
  const align = ALIGNMENT_MAP[activityHorizontalAlignment(theme)];
  const skin = activitySkinSimple(fc);
  // `SheetBuilder#createSheet` returns `Sheet<StripeAtom>` (the Sheet/
  // Stripe-level union); `SheetBlock1` wants `Sheet<CreoleAtom>` -- the
  // SAME type gap `DisplayCreole.ts#getCreole`/`CreoleHorizontalLine.ts
  // #getTitle` already cast through (both pre-existing, unrelated to
  // this task).
  const sheet = skin.sheet(fc, align, CreoleMode.FULL).createSheet(Display.create(label.split('\n'))) as unknown as Sheet<CreoleAtom>;
  const atomOps = chromeAtomOps(undefined, fc);
  return new SheetBlock1(sheet, LineBreakStrategy.NONE, atomOps, activityPadding('activity'));
}

/**
 * Draws `tb` at the box's own top-left corner (`x`, `y`) -- `FtileBox
 * #drawU`'s `this.tb.drawU(ug)` call for `HorizontalAlignment.LEFT`
 * (`FtileBox.java:224-225`, no extra translate: `SheetBlock1`'s own
 * padding constructor arg already accounts for the inset). The SAME
 * throwaway-`UGraphicSvg` + `extractFlatContent` technique `activity-
 * renderer-text.ts#drawRun` already uses for a single `UText`, applied
 * here to a whole multi-stripe `TextBlock`.
 */
export function drawActionTextBlock(tb: SheetBlock1, x: number, y: number, measurer: StringMeasurer, font: FontSpec): string {
  const driverBounder = {
    calculateDimension(fc: { readonly size: number }, text: string) {
      return { width: measurer.measure(text, { ...font, size: fc.size }).width };
    },
  };
  const ug = UGraphicSvg.build(0, basicSvgOption(), THROWAWAY_VERSION, driverBounder, measurer);
  tb.drawU(ug.apply(new UTranslate(x, y)));
  return extractFlatContent(ug.getSvgString()).body;
}

const DRAW_MEASURER = new WidthTableMeasurer();

/**
 * `true` when this label is in this spike's verified scope -- shared by
 * {@link renderActionLabel} (drawing) AND `gtile-action.ts#sheetDimension`
 * (sizing), so the two NEVER disagree about which labels use the Sheet
 * (a label `sheetDimension` sized via the Sheet but `renderActionLabel`
 * drew via the pre-existing per-line path, or vice-versa, would size and
 * draw the SAME box two different ways -- jar-verified regression on
 * `fikuki-99-kulu790`/`mufixi-71-koma752`, both `skinparam
 * defaultTextAlignment center` with a `{{ }}` embed, caught once the
 * nested-diagram renderer started actually rendering instead of silently
 * falling back). Excluded, each a CONFIRMED blocker, not a guess:
 *  - a table row (`StripeTable`'s own dedicated draw, `activity-
 *    renderer-text.ts#renderCreoleTableGrid`, untouched);
 *  - a non-LEFT alignment (`FtileBox.java:224-233`'s CENTER/RIGHT
 *    branches each need an extra X translate `FtileBoxOld.ts#drawU`
 *    already ports for mindmap/wbs -- not yet wired here, so falling
 *    back is the honest choice over guessing the offset);
 *  - a bare `----`/`====`/`....` separator (`HORIZONTAL_LINE`,
 *    `CreoleStripeSimpleParser.ts#classifyStripeLine`): `StripeSimple.ts
 *    #analyzeAndAdd` adds a REAL `CreoleHorizontalLine` atom, whose
 *    `drawU` (`CreoleHorizontalLine.ts:115`) calls `ug.draw
 *    (UHorizontalLine)`; `UGraphicSvg.ts#register` (`u-graphic-svg.ts
 *    :164-178`) registers drivers for `URectangle`/`UEllipse`/`ULine`/
 *    `UPolygon`/`UPath`/`DotPath`/`UText`/`UImage`/`UComment`/`UEmpty`
 *    -- NOT `UHorizontalLine` -- so `ug.draw(...)` throws `"No driver
 *    registered for shape UHorizontalLine"` (`AbstractCommonUGraphic.ts
 *    :140`), jar-reproduced via `bigide-91-bise382`. A real fix needs a
 *    NEW SVG driver plus the `Stencil` context `UGraphicStencil`/
 *    `AbstractUGraphicHorizontalLine` resolve the rule's clip bounds
 *    from (neither exists in this port's `UGraphicSvg` yet) -- a
 *    `src/core/**` change, out of this pass's remaining scope; `bigide`'s
 *    own row is ALREADY correct via the pre-existing per-line path's
 *    `drawHorizontalRule` (this mission's own STRIPE commit);
 *  - a `[[url]]` run: jar-verified regression on `nesozi-09-zezu092`
 *    (`skinparam hyperlinkColor black`/`hyperlinkUnderline false`) --
 *    {@link activitySkinSimple}'s minimal `ISkinSimple` does not (yet)
 *    thread those two theme overrides into the real `CreoleParser`'s
 *    resolved `FontConfiguration` for a url run.
 */
export function isActionSheetEligible(label: string, theme: Theme): boolean {
  if (activityHorizontalAlignment(theme) !== 'left') return false;
  return !label
    .split('\n')
    .some((l) => isTableRowLine(l) || classifyStripeLine(l).type === 'HORIZONTAL_LINE' || l.includes('[['));
}

/**
 * The `renderAction` entry point: `null` when {@link isActionSheetEligible}
 * says no (its own doc comment for every excluded case). The caller's
 * own `<code>` dispatch (`renderActionCodeBlock`) already returns
 * before reaching this function, so no code-block check here.
 */
export function renderActionLabel(
  label: string,
  theme: Theme,
  fontSize: number,
  box: { readonly x: number; readonly y: number },
): string | null {
  if (!isActionSheetEligible(label, theme)) return null;
  const tb = buildActionTextBlock(label, theme, fontSize, 'activity');
  const font = { family: activityFontFamily(theme, 'activity'), size: fontSize };
  return drawActionTextBlock(tb, box.x, box.y, DRAW_MEASURER, font);
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
  const fontSize = activityFontSize(theme, 'note');
  const fc: FontConfiguration = {
    family: activityFontFamily(theme, 'note'),
    size: fontSize,
    color: activityFontColor(theme, 'note'),
    styles: new Set(),
  };
  const align = ALIGNMENT_MAP[activityNoteHorizontalAlignment(theme)];
  const skin = activitySkinSimple(fc);
  const sheet = skin.sheet(fc, align, CreoleMode.FULL).createSheet(Display.create(text.split('\n'))) as unknown as Sheet<CreoleAtom>;
  const atomOps = chromeAtomOps(undefined, fc);
  return new SheetBlock1(sheet, LineBreakStrategy.NONE, atomOps);
}

/**
 * `Opale#getWidth`/`getHeight` (`svek/image/Opale.java:89-96`): the note
 * box's own `textBlock.calculateDimension` plus Opale's fixed margins --
 * shared by {@link measureOpaleCreole} (layout time, the caller's own
 * real `StringBounder`) and {@link renderNoteLabel}'s own eligibility
 * recheck (render time, a fixed deterministic measurer), so the two
 * NEVER disagree about a note's size, mirroring
 * {@link isActionSheetEligible}'s own doc comment for the action box.
 */
export function noteTextBlockDimension(tb: SheetBlock1, sheetBounder: StringBounder): { width: number; height: number } {
  const dim = tb.calculateDimension(sheetBounder);
  return { width: dim.getWidth() + NOTE_MARGIN_X1 + NOTE_MARGIN_X2, height: dim.getHeight() + 2 * NOTE_MARGIN_Y };
}

/** `Opale#drawU`'s own `textBlock.drawU(ug.apply(new UTranslate(marginX1,
 *  marginY)))` (`Opale.java:126`) -- unconditional on alignment (CENTER/
 *  RIGHT normalisation happens WITHIN the Sheet's own per-line `Sea`
 *  layout, not as an outer box translate the way {@link
 *  buildActionTextBlock}'s LEFT/CENTER/RIGHT split needs for `FtileBox`).
 *
 * Eligibility is GEOMETRIC, not syntactic (unlike {@link
 * isActionSheetEligible}): `GtileWithNotes`'s own stacked multi-note
 * sizing (`tiles/gtile-with-notes.ts#buildStack`, NOTE-MULTI family) is
 * NOT yet routed through {@link buildNoteTextBlock} -- its own caller
 * chain (`layout/tile-layout-structural.ts`, outside this task's
 * write-set) threads it a bare `fontSize: number`, not a `Theme`, so it
 * cannot build this Sheet without a `layout/**` edit this mission
 * forbids. A note node whose OWN declared `box.width`/`box.height`
 * disagrees with this function's freshly-recomputed creole dimension is
 * exactly a note `renderNote`'s caller sized the OLD way -- `null` here
 * falls back to the pre-existing raw per-line renderer rather than draw
 * creole markup inside a box measured for plain text (the same class of
 * sizing/drawing mismatch `isActionSheetEligible`'s own doc comment
 * reports for `fikuki-99-kulu790`/`mufixi-71-koma752`, avoided here by
 * construction instead of by a second syntactic gate).
 */
export function renderNoteLabel(
  text: string,
  theme: Theme,
  box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
): string | null {
  const fontSize = activityFontSize(theme, 'note');
  const font = { family: activityFontFamily(theme, 'note'), size: fontSize };
  const tb = buildNoteTextBlock(text, theme);
  const sheetBounder = klimtStringBounder(DRAW_MEASURER, font);
  const sheetBox = noteTextBlockDimension(tb, sheetBounder);
  if (Math.abs(sheetBox.width - box.width) > 1e-6 || Math.abs(sheetBox.height - box.height) > 1e-6) return null;
  return drawActionTextBlock(tb, box.x + NOTE_MARGIN_X1, box.y + NOTE_MARGIN_Y, DRAW_MEASURER, font);
}
