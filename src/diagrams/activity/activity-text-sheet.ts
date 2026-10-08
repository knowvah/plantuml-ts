/**
 * activity-text-sheet -- every activity label that is NOT an action or note
 * body, drawn through the creole `TextBlock` upstream builds it as:
 * `Display#create0`'s `getCreole` (`Display.java:692-701`, ported at
 * `core/klimt/creole/DisplayCreole.ts`) -> `SheetBuilder` -> `SheetBlock1`
 * -> `SheetBlock2`. Callers:
 *
 * - edge labels: `FtileFactoryDelegator#getTextBlock`
 *   (`FtileFactoryDelegator.java:103-112`, `create7(fc, LEFT, skinParam,
 *   CreoleMode.SIMPLE_LINE)`) and `Branch#getTextBlock` (`Branch.java:250-258`,
 *   the same `SIMPLE_LINE` LEFT block);
 * - diamond / branch labels: `ConditionalBuilder` (`:240-244,280-282`);
 * - partition / group titles: `FtileGroup.java:104-108`;
 * - swimlane titles: `Swimlanes.java:285-293` (`create9`);
 * - fork / join bar labels: `FtileBlackBlock`.
 *
 * The action/note Sheets live in `activity-creole-sheet.ts` (T3e's); its
 * `ISkinSimple` builder is private, so this module keeps its own copy, and
 * its draw keeps the `<back:color>` filter defs that file's draw drops.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:614-701
 */
import type { Theme } from '../../core/theme.js';
import type { ActivitySName } from './activity-style-defaults.js';
import { activityFontColor, activityFontFamily, activityHyperlinkColor } from './activity-text-style.js';
import { Display } from '../../core/klimt/creole/Display.js';
import type { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import type { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { LineBreakStrategy } from '../../core/klimt/LineBreakStrategy.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { chromeAtomOps } from '../../core/annotations/blocks-creole.js';
import { GUILLEMET_DEFAULT } from '../../core/text/Guillemet.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { MONOSPACED } from '../../core/klimt/creole/Parser.js';
import { getNestedDiagramRenderer } from '../../core/nested-diagram-registry.js';
import type { NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { ISkinSimple } from '../../core/style/ISkinSimple.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { UChange } from '../../core/klimt/UChange.js';
import type { Sheet } from '../../core/klimt/creole/Sheet.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { extractFlatContent } from '../../core/klimt/document-shell-fragment.js';
import { WidthTableMeasurer } from '../../core/measurer.js';
import { backColorFilterDef } from '../../core/svg-defs.js';

/** `{{ }}` inside a label -- the global registry (`src/index.ts`), absent
 *  only when nothing registered one (a unit test). */
function nestedRenderer(): NestedDiagramRenderer {
  return (
    getNestedDiagramRenderer() ?? {
      render(): TextBlock {
        throw new Error('activity: no nested-diagram renderer is registered');
      },
    }
  );
}

/** The `ISkinSimple` surface `CreoleParser`/`StripeSimple` read for a label:
 *  `SkinParam.java` defaults (no sprites, identity size hack, `MONOSPACED`,
 *  tabsize 8, dpi 96), the same members `activity-creole-sheet.ts
 *  #activitySkinSimple` builds, plus `getPadding()`: `skinparam padding N`
 *  (`SkinParam.java:1147-1150`, `theme.padding`), which `Display#getCreole`
 *  hands its `SheetBlock1` (`Display.java:697-699`). */
function activitySkinSimple(fontConfiguration: FontConfiguration, theme: Theme): ISkinSimple {
  const padding = ClockwiseTopRightBottomLeft.same(theme.padding ?? 0);
  const atomOps = chromeAtomOps(undefined, fontConfiguration);
  const pragma = Pragma.createEmpty();
  const skin: ISkinSimple = {
    getSprite: () => null,
    guillemet: () => GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s: string) => s,
    getValue: () => null,
    values: () => new Map<string, string>(),
    getPadding: () => padding,
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

/** `style.getFontConfiguration(colorSet)` (`Style.java:259-268`) for one
 *  activity SName: family, size, colour, `HyperLinkColor`, and
 *  `useUnderlineForHyperlink` (`SkinParam.java:1057-1060`). */
export function activityTextFontConfiguration(theme: Theme, fontSize: number, sname: ActivitySName): FontConfiguration {
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

/** The `Display#create0` arguments every caller here supplies. */
export interface ActivityDisplayParams {
  readonly fontConfiguration: FontConfiguration;
  readonly horizontalAlignment: HorizontalAlignment;
  readonly creoleMode: CreoleMode;
  /** `style.wrapWidth()`; `LineBreakStrategy.NONE` when omitted. */
  readonly maxMessageSize?: LineBreakStrategy;
}

/**
 * `display.create0(fc, align, skinParam, maxMessageSize, creoleMode, null,
 * null)` (`Display.java:637-669`) for a label whose `\n`s are already line
 * breaks (`Display.getWithNewlines`, applied by the parser).
 */
export function activityDisplayBlock(label: string, theme: Theme, params: ActivityDisplayParams): TextBlock {
  const fc = params.fontConfiguration;
  const ctx = {
    fontConfiguration: fc,
    spriteContainer: activitySkinSimple(fc, theme),
    atomOps: chromeAtomOps(undefined, fc),
  };
  return Display.create(label.split('\n')).create0(
    ctx,
    params.horizontalAlignment,
    params.maxMessageSize ?? LineBreakStrategy.NONE,
    params.creoleMode,
  );
}

/** `skinParam.sheet(fc, align, mode).createSheet(display)` -- the Sheet a
 *  caller wraps in its own `SheetBlock1` (`ConditionalBuilder.java:241-243`).
 *  `SheetBuilder#createSheet` returns `Sheet<StripeAtom>`; `SheetBlock1`
 *  wants `Sheet<CreoleAtom>` -- the type gap `DisplayCreole.ts#getCreole`
 *  casts through. */
export function activitySheet(label: string, theme: Theme, params: ActivityDisplayParams): Sheet<CreoleAtom> {
  const fc = params.fontConfiguration;
  return activitySkinSimple(fc, theme)
    .sheet(fc, params.horizontalAlignment, params.creoleMode)
    .createSheet(Display.create(label.split('\n'))) as unknown as Sheet<CreoleAtom>;
}

/** `$version$` -- the placeholder `activity-creole-sheet.ts` passes to its
 *  throwaway `UGraphicSvg`, for the same purpose. */
const THROWAWAY_VERSION = '$version$';

const DRAW_MEASURER = new WidthTableMeasurer();

/** One `getFilterBackColor` def (`SvgGraphics.java:772-786`) as the klimt
 *  emitter writes it: its seeded id and its `flood-color`. */
const KLIMT_BACK_FILTER_RE = /<filter id="([^"]*)"[^>]*><feFlood flood-color="([^"]*)"/g;

/**
 * A `<back:color>` run's `feFlood` filter, moved from the throwaway
 * document's `<defs>` (which `extractFlatContent` separates and the caller
 * would drop) into the body, re-keyed by colour -- `svg-defs.ts
 * #backColorFilterDef`, the content-keyed id `core/svg.ts#text` emits and
 * `svg-defs.ts#extractFilterDefs` lifts back into the document `<defs>`.
 * The throwaway graphic's own `filterUid` (`'b' + seed`) is 0 for every
 * fragment, so its ids would collide across labels.
 */
function withBackColorFilters(body: string, extraDefs: string): string {
  let out = body;
  let defs = '';
  for (const m of extraDefs.matchAll(KLIMT_BACK_FILTER_RE)) {
    const { id, def } = backColorFilterDef(m[2]!);
    out = out.split(`url(#${m[1]!})`).join(`url(#${id})`);
    defs += def;
  }
  return defs + out;
}

/** `tb.drawU(ug.apply(new UTranslate(x, y)))` with the owner's ambient
 *  `ug.apply(...)` chain (`changes`) on a throwaway `UGraphicSvg` --
 *  `SvgOption.linkTarget` carries `skinparam svgLinkTarget`
 *  (`UGraphicSvg.java:161`). */
export function drawActivityTextBlock(
  tb: TextBlock,
  at: { readonly x: number; readonly y: number },
  theme: Theme,
  fc: FontConfiguration,
  changes: readonly UChange[] = [],
): string {
  const driverBounder = {
    calculateDimension(f: { readonly size: number }, text: string) {
      return { width: DRAW_MEASURER.measure(text, { family: fc.family, size: f.size }).width };
    },
  };
  const option = basicSvgOption(theme.svgLinkTarget === undefined ? {} : { linkTarget: theme.svgLinkTarget });
  const ug = UGraphicSvg.build(0, option, THROWAWAY_VERSION, driverBounder, DRAW_MEASURER);
  tb.drawU(changes.reduce<UGraphic>((g, c) => g.apply(c), ug.apply(new UTranslate(at.x, at.y))));
  const { body, extraDefs } = extractFlatContent(ug.getSvgString());
  return withBackColorFilters(body, extraDefs);
}
