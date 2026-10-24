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
import type { StringMeasurer } from '../../core/measurer.js';
import {
  type SkinparamWarningSource,
  skinParamWarnings,
  uniqueWarnings,
  withWarningBanner as withSharedWarningBanner,
} from '../../core/skinparam-warnings.js';
import type { Warning } from '../../core/warning/Warning.js';
import type { ActivityDiagramAST } from './ast.js';
import type { DocumentMargin } from './activity-layout-constants.js';

/** Fixed id namespace for the banner's own klimt document
 *  (`renderDrawableToFragment`'s `uid`); the banner emits no defs. */
const BANNER_UID = 'activity-warning-banner';

/**
 * `ast` with `warnings` set to `CommandSkinParam#executeArg`'s warnings for
 * the collected `skinparam` map ({@link skinParamWarnings}, the shared core
 * module since sdd2-T7e).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParam.java:88-99
 */
export function withSkinParamWarnings(
  ast: ActivityDiagramAST,
  skinparam: SkinparamWarningSource | ReadonlyMap<string, string> | undefined,
): ActivityDiagramAST {
  const warnings = skinParamWarnings(skinparam);
  return warnings.length === 0 ? ast : { ...ast, warnings };
}

/**
 * `TitledDiagram#getWarnings()`: the skinparam warnings, then the pragma's,
 * de-duplicated by value.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:326-334
 */
export function activityWarnings(ast: ActivityDiagramAST): readonly Warning[] {
  return uniqueWarnings(ast.warnings ?? [], ast.pragma?.getWarnings() ?? []);
}

/**
 * `DiagramChromeFactory#addWarnings` over the activity fragment: the shared
 * {@link withSharedWarningBanner} under the activity's banner namespace.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:176-200
 */
export function withWarningBanner(
  fragment: RenderFragment,
  warnings: readonly Warning[],
  measurer: StringMeasurer,
  margin: DocumentMargin,
): RenderFragment {
  return withSharedWarningBanner(fragment, warnings, measurer, margin, BANNER_UID);
}
