/**
 * The activity diagram's warning channel and its banner (add4-T2e,
 * WARN-BANNER).
 *
 * Upstream collects warnings on the diagram (`TitledDiagram#addWarning` ->
 * `getPragma().addWarning`, TitledDiagram.java:321-323) and reads them back
 * as `join(getPreprocessingArtifact().getWarnings(), getPragma()
 * .getWarnings())`, a `LinkedHashSet` (TitledDiagram.java:326-334).
 * `DiagramChromeFactory.create` draws them FIRST, as a banner stacked above
 * the raw text block, before mainframe/legend/title/caption/header/footer
 * (DiagramChromeFactory.java:124-135); `TextBlockExporter`'s document margin
 * then wraps the decorated whole.
 *
 * Two producers reach this port's activity engine:
 * - command warnings, added to `ast.pragma` while the parser runs
 *   (`CommandPartition3.java:155-157`, `CommandCloseGroupLegacy3.java:75`,
 *   `CommandActivity3.java:130-135`, ...) -- `ctx.pragma.addWarning(...)`;
 * - `CommandSkinParam#executeArg`'s deprecation warnings
 *   (CommandSkinParam.java:92-99). The preprocessor hoists `skinparam`
 *   lines out of the block before the parser sees it, so they are rebuilt
 *   from the collected skinparam map ({@link withSkinParamWarnings}) into
 *   `ast.warnings`, ahead of the command warnings -- the same
 *   skinparams-first order `mindmap/MindMapDiagramFactory.ts
 *   #addSkinParamWarnings` uses. Upstream's order is source order, so a
 *   `skinparam` written AFTER a warning command is the one case this
 *   reorders.
 *
 * Preprocessing-artifact warnings (`EaterOption.java`, `!option`) do not
 * reach the activity engine: the block carries no `PreprocessingArtifact`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:321-334
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:124-135,176-200
 */
import type { RenderFragment } from '../../core/dispatcher.js';
import { WarningBannerBlock } from '../../core/annotations/WarningBannerBlock.js';
import { shiftFragmentBody } from '../../core/annotations/coord-shift.js';
import { ColorMapper } from '../../core/klimt/color/ColorMapper.js';
import { renderDrawableToFragment } from '../../core/klimt/document-shell-fragment.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { Warning } from '../../core/warning/Warning.js';
import type { ActivityDiagramAST } from './ast.js';
import { SVG_CANVAS_CEIL } from './activity-layout-constants.js';

/** The `new Warning(...)` texts `CommandSkinParam#executeArg` adds, keyed by
 *  the lower-cased skin parameter name (`equalsIgnoreCase`).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParam.java:92-99 */
const SKINPARAM_WARNINGS: ReadonlyMap<string, string> = new Map([
  ['handwritten', "Please use '!option handwritten true' to enable handwritten "],
  ['participantpadding', 'Please use CSS style instead of skinparam ParticipantPadding'],
  ['padding', 'Please use CSS style instead of skinparam padding'],
]);

/** Fixed id namespace for the banner's own klimt document
 *  (`renderDrawableToFragment`'s `uid`); the banner emits no defs. */
const BANNER_UID = 'activity-warning-banner';

/** `LinkedHashSet<Warning>#add`: append unless an equal warning is present. */
function addUnique(into: Warning[], warning: Warning): void {
  if (!into.some((w) => w.equals(warning))) into.push(warning);
}

/**
 * `ast` with `warnings` set to `CommandSkinParam#executeArg`'s warnings for
 * the collected `skinparam` map, in the map's (first-assignment) order. The
 * collector keeps no line form, so a `skinparam { ... }` block entry warns
 * too, where upstream's `CommandSkinParamMultilines` does not.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParam.java:88-99
 */
export function withSkinParamWarnings(
  ast: ActivityDiagramAST,
  skinparam: ReadonlyMap<string, string> | undefined,
): ActivityDiagramAST {
  const warnings: Warning[] = [];
  for (const name of skinparam?.keys() ?? []) {
    const message = SKINPARAM_WARNINGS.get(name.toLowerCase());
    if (message !== undefined) addUnique(warnings, new Warning(message));
  }
  return warnings.length === 0 ? ast : { ...ast, warnings };
}

/**
 * `TitledDiagram#getWarnings()`: the skinparam warnings, then the pragma's,
 * de-duplicated by value.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:326-334
 */
export function activityWarnings(ast: ActivityDiagramAST): readonly Warning[] {
  const result: Warning[] = [];
  for (const w of ast.warnings ?? []) addUnique(result, w);
  for (const w of ast.pragma?.getWarnings() ?? []) addUnique(result, w);
  return result;
}

/** `Math.floor(raw + 2 * margin + SVG_CANVAS_CEIL)`: a canvas side for a raw
 *  span (`TextBlockExporter` margin + `SvgGraphics#ensureVisible`). */
function canvasSide(raw: number, margin: number): number {
  return Math.floor(raw + 2 * margin + SVG_CANVAS_CEIL);
}

/**
 * `DiagramChromeFactory#addWarnings` over the activity fragment: the banner
 * at the raw block's origin (the document margin's `(margin, margin)` in
 * this fragment's margin-baked coordinates), drawn at the stacked block's
 * full width, the diagram body moved down by the banner height. The new
 * raw dims (`preChromeWidth`/`preChromeHeight`) are the stack's, so a
 * chrome pass composes title/legend/... around banner + body, as upstream's
 * decoration order does. `fragment` unchanged when there is no warning.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:176-200
 */
export function withWarningBanner(
  fragment: RenderFragment,
  warnings: readonly Warning[],
  measurer: StringMeasurer,
  margin: number,
): RenderFragment {
  if (warnings.length === 0) return fragment;
  const rawW = fragment.preChromeWidth ?? fragment.width - 2 * margin - SVG_CANVAS_CEIL;
  const rawH = fragment.preChromeHeight ?? fragment.height - 2 * margin - SVG_CANVAS_CEIL;
  const banner = new WarningBannerBlock(warnings, ColorMapper.IDENTITY);
  let bannerW = 0;
  let bannerH = 0;
  const drawable = {
    drawU(ug: UGraphic): void {
      const dim = banner.calculateDimension(ug.getStringBounder());
      bannerW = dim.getWidth();
      bannerH = dim.getHeight();
      banner.drawU(ug.apply(new UTranslate(margin, margin)), Math.max(bannerW, rawW));
    },
  };
  const drawn = renderDrawableToFragment(drawable, { width: 0, height: 0, measurer, uid: BANNER_UID });
  const stackW = Math.max(bannerW, rawW);
  const stackH = bannerH + rawH;
  return {
    ...fragment,
    body: drawn.body + shiftFragmentBody(fragment.body, 0, bannerH),
    width: fragment.width - canvasSide(rawW, margin) + canvasSide(stackW, margin),
    height: fragment.height - canvasSide(rawH, margin) + canvasSide(stackH, margin),
    preChromeWidth: stackW,
    preChromeHeight: stackH,
  };
}
