/**
 * The shared warning channel and banner of the engines that draw one
 * (activity, sequence), lifted out of `diagrams/activity/activity-warnings.ts`
 * (sdd2-T7e) so a second engine does not copy it.
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
 * `CommandSkinParam#executeArg`'s deprecation warnings (CommandSkinParam
 * .java:92-99) are rebuilt from the collected skinparam map
 * ({@link skinParamWarnings}) because the preprocessor hoists `skinparam`
 * lines out of the block before the parser sees it (line form only); they come ahead of the
 * command warnings (upstream's order is source order, so a `skinparam`
 * written AFTER a warning command is the one case this reorders).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:321-334
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:124-135,176-200
 */
import type { PreprocessorResult } from './preprocessor.js';
import type { RenderFragment } from './dispatcher.js';
import type { DocumentMargin } from './document-margin.js';
import { WarningBannerBlock } from './annotations/WarningBannerBlock.js';
import { shiftFragmentBody } from './annotations/coord-shift.js';
import { ColorMapper } from './klimt/color/ColorMapper.js';
import { renderDrawableToFragment } from './klimt/document-shell-fragment.js';
import type { UGraphic } from './klimt/UGraphic.js';
import { UTranslate } from './klimt/UTranslate.js';
import type { StringMeasurer } from './measurer.js';
import { withDeferredFormat } from './svg-format.js';
import { Warning } from './warning/Warning.js';

/** `SvgGraphics#ensureVisible`'s `+ 1` before the `(int)` truncation
 *  (`SvgGraphics.java:129-135`). */
const SVG_CANVAS_CEIL = 1;

/** The `new Warning(...)` texts `CommandSkinParam#executeArg` adds, keyed by
 *  the lower-cased skin parameter name (`equalsIgnoreCase`).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParam.java:92-99 */
const SKINPARAM_WARNINGS: ReadonlyMap<string, string> = new Map([
  ['handwritten', "Please use '!option handwritten true' to enable handwritten "],
  ['participantpadding', 'Please use CSS style instead of skinparam ParticipantPadding'],
  ['padding', 'Please use CSS style instead of skinparam padding'],
]);

/** `LinkedHashSet<Warning>#add`: append unless an equal warning is present. */
export function addUniqueWarning(into: Warning[], warning: Warning): void {
  if (!into.some((w) => w.equals(warning))) into.push(warning);
}

/** What {@link skinParamWarnings} reads: the collected map and, when the
 *  collector located each form, its assignments. */
export type SkinparamWarningSource = Pick<PreprocessorResult, 'skinparam' | 'skinparamAssignments'>;

/** The skin parameter names whose LINE-form assignment upstream warns on, in
 *  first-assignment order. A hand-built source without `skinparamAssignments`
 *  (or a bare map) has no recorded form: every map key counts, as before. */
function lineFormNames(source: SkinparamWarningSource | ReadonlyMap<string, string> | undefined): Iterable<string> {
  if (source === undefined) return [];
  if (source instanceof Map) return source.keys();
  const { skinparam, skinparamAssignments } = source as SkinparamWarningSource;
  if (skinparamAssignments === undefined) return skinparam?.keys() ?? [];
  return skinparamAssignments.filter((a) => a.form !== 'block').map((a) => a.key);
}

/**
 * `CommandSkinParam#executeArg`'s warnings, for the LINE-form assignments
 * only (`skinparam handwritten true`), first-assignment order, de-duplicated.
 * An entry of `skinparam [name] {` is `CommandSkinParamMultilines`, which
 * delegates to `SkinLoader` and never warns
 * (CommandSkinParamMultilines.java:90-102); the parameter still applies, via
 * the merged map.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParam.java:88-99
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParamMultilines.java:90-102
 */
export function skinParamWarnings(source: SkinparamWarningSource | ReadonlyMap<string, string> | undefined): Warning[] {
  const warnings: Warning[] = [];
  for (const name of lineFormNames(source)) {
    const message = SKINPARAM_WARNINGS.get(name.toLowerCase());
    if (message !== undefined) addUniqueWarning(warnings, new Warning(message));
  }
  return warnings;
}

/** The de-duplicated union of the given warning lists, in order
 *  (`TitledDiagram#getWarnings`, TitledDiagram.java:326-334). */
export function uniqueWarnings(...lists: readonly (readonly Warning[])[]): readonly Warning[] {
  const result: Warning[] = [];
  for (const list of lists) for (const w of list) addUniqueWarning(result, w);
  return result;
}

/** `Math.floor(raw + near + far + SVG_CANVAS_CEIL)`: a canvas side for a raw
 *  span (`TextBlockExporter.java:199-202` + `SvgGraphics#ensureVisible`). */
function canvasSide(raw: number, near: number, far: number): number {
  return Math.floor(raw + (near + far + SVG_CANVAS_CEIL));
}

/**
 * `DiagramChromeFactory#addWarnings` over a margin-baked fragment: the banner
 * at the raw block's origin (the document margin's `(margin, margin)`,
 * `TextBlockExporter.java:172`), drawn at the stacked block's full width, the
 * diagram body moved down by the banner height. The new raw dims
 * (`preChromeWidth`/`preChromeHeight`) are the stack's, so a chrome pass
 * composes title/legend/... around banner + body, as upstream's decoration
 * order does. `fragment` unchanged when there is no warning. `uid` is the id
 * namespace of the banner's own klimt document (it emits no defs).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:176-200
 */
export function withWarningBanner(
  fragment: RenderFragment,
  warnings: readonly Warning[],
  measurer: StringMeasurer,
  margin: DocumentMargin,
  uid: string,
): RenderFragment {
  if (warnings.length === 0) return fragment;
  const rawW = fragment.preChromeWidth ?? fragment.width - (margin.left + margin.right + SVG_CANVAS_CEIL);
  const rawH = fragment.preChromeHeight ?? fragment.height - (margin.top + margin.bottom + SVG_CANVAS_CEIL);
  const banner = new WarningBannerBlock(warnings, ColorMapper.IDENTITY);
  let bannerW = 0;
  let bannerH = 0;
  const drawable = {
    drawU(ug: UGraphic): void {
      const dim = banner.calculateDimension(ug.getStringBounder());
      bannerW = dim.getWidth();
      bannerH = dim.getHeight();
      banner.drawU(ug.apply(new UTranslate(margin.left, margin.top)), Math.max(bannerW, rawW));
    },
  };
  // isw-T2c-scale: drawn into a scaled document, formatted by its scale pass.
  const drawn = withDeferredFormat(fragment.numbersDeferred === true, () =>
    renderDrawableToFragment(drawable, { width: 0, height: 0, measurer, uid }),
  );
  const stackW = Math.max(bannerW, rawW);
  const stackH = bannerH + rawH;
  return {
    ...fragment,
    body: drawn.body + shiftFragmentBody(fragment.body, 0, bannerH),
    width: fragment.width - canvasSide(rawW, margin.left, margin.right) + canvasSide(stackW, margin.left, margin.right),
    height:
      fragment.height - canvasSide(rawH, margin.top, margin.bottom) + canvasSide(stackH, margin.top, margin.bottom),
    preChromeWidth: stackW,
    preChromeHeight: stackH,
  };
}
