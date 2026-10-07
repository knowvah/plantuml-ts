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
import { activityHorizontalAlignment } from './activity-text-style.js';
import { activityPadding } from './activity-style-defaults.js';
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
 * The `renderAction` entry point: `null` when this label is not (yet)
 * this spike's verified scope:
 *  - a table row (`StripeTable`'s own dedicated draw, `activity-
 *    renderer-text.ts#renderCreoleTableGrid`, untouched);
 *  - a non-LEFT alignment (`FtileBox.java:224-233`'s CENTER/RIGHT
 *    branches each need an extra X translate `FtileBoxOld.ts#drawU`
 *    already ports for mindmap/wbs -- not yet wired here, so falling
 *    back is the honest choice over guessing the offset);
 *  - a bare `----`/`====`/`....` separator (`HORIZONTAL_LINE`,
 *    `CreoleStripeSimpleParser.ts#classifyStripeLine`): CONFIRMED
 *    BLOCKER, not a guess -- `StripeSimple.ts#analyzeAndAdd` adds a
 *    REAL `CreoleHorizontalLine` atom, whose `drawU` (`CreoleHorizontalLine
 *    .ts:115`) calls `ug.draw(UHorizontalLine)`; `UGraphicSvg.ts#register`
 *    (`u-graphic-svg.ts:164-178`) registers drivers for `URectangle`/
 *    `UEllipse`/`ULine`/`UPolygon`/`UPath`/`DotPath`/`UText`/`UImage`/
 *    `UComment`/`UEmpty` -- NOT `UHorizontalLine` -- so `ug.draw(...)`
 *    throws `"No driver registered for shape UHorizontalLine"`
 *    (`AbstractCommonUGraphic.ts:140`), jar-reproduced via `bigide-91-
 *    bise382`. A real fix needs a NEW SVG driver plus the `Stencil`
 *    context `UGraphicStencil`/`AbstractUGraphicHorizontalLine`
 *    resolve the rule's clip bounds from (neither exists in this
 *    port's `UGraphicSvg` yet) -- a `src/core/**` change, out of this
 *    pass's remaining scope; `bigide`'s own row is ALREADY correct via
 *    the pre-existing per-line path's `drawHorizontalRule`
 *    (`activity-renderer-text.ts`, this mission's own STRIPE commit),
 *    so falling back here costs nothing.
 * The caller's own `<code>` dispatch (`renderActionCodeBlock`) already
 * returns before reaching this function, so no code-block check here.
 */
export function renderActionLabel(
  label: string,
  theme: Theme,
  fontSize: number,
  box: { readonly x: number; readonly y: number },
): string | null {
  if (activityHorizontalAlignment(theme) !== 'left') return null;
  const physicalLines = label.split('\n');
  if (
    physicalLines.some(
      (l) => isTableRowLine(l) || classifyStripeLine(l).type === 'HORIZONTAL_LINE' || l.includes('[['),
    )
  ) {
    return null;
  }
  const tb = buildActionTextBlock(label, theme, fontSize, 'activity');
  const font = { family: activityFontFamily(theme, 'activity'), size: fontSize };
  return drawActionTextBlock(tb, box.x, box.y, DRAW_MEASURER, font);
}
