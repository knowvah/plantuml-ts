/**
 * The sequence diagram's warning channel and banner (sdd2-T7e).
 *
 * Two producers reach the banner `DiagramChromeFactory#addWarnings` draws
 * above the diagram (`DiagramChromeFactory.java:124-135,176-200`):
 * - `CommandSkinParam#executeArg`'s deprecation warnings (`CommandSkinParam
 *   .java:92-99`), rebuilt from the collected skinparam map into
 *   `ast.warnings` (`core/skinparam-warnings.ts`);
 * - `Reference#addNote`'s `This position is ignored: <POSITION>`
 *   (`Reference.java:166-171`), derived from the events
 *   ({@link ignoredNoteWarnings}).
 *
 * The banner goes on the margin-baked fragment the renderer returns, before
 * chrome: the same composition the activity engine uses, with sequence's own
 * `same(5)` document margin (`SequenceDiagram.java:629-633`).
 *
 * `tests/oracle/svg-conformance/render-fixture-sequence.ts` mirrors the
 * plugin's use of these three functions; change both together.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:321-334
 */
import type { RenderFragment } from '../../core/dispatcher.js';
import { documentMarginOf } from '../../core/document-margin.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SkinparamWarningSource } from '../../core/skinparam-warnings.js';
import { skinParamWarnings, uniqueWarnings, withWarningBanner } from '../../core/skinparam-warnings.js';
import type { Warning } from '../../core/warning/Warning.js';
import type { SequenceDiagramAST, SequenceGeometry } from './ast.js';
import { ignoredNoteWarnings } from './sequence-note-folding.js';

/** The plugin's geometry: the laid-out diagram plus its warnings. */
export type SequencePluginGeometry = SequenceGeometry & { readonly warnings?: readonly Warning[] };

/** Fixed id namespace for the banner's own klimt document; it emits no defs. */
const BANNER_UID = 'sequence-warning-banner';

/** `ast` with `warnings` set to the collected skinparams' deprecation
 *  warnings (`CommandSkinParam.java:88-99`). */
export function withSkinParamWarnings(
  ast: SequenceDiagramAST,
  skinparam: SkinparamWarningSource | ReadonlyMap<string, string> | undefined,
): SequenceDiagramAST {
  const warnings = skinParamWarnings(skinparam);
  return warnings.length === 0 ? ast : { ...ast, warnings };
}

/** `TitledDiagram#getWarnings()` for a sequence diagram: skinparam warnings,
 *  then the ignored-note ones, de-duplicated by value. */
export function sequenceWarnings(ast: SequenceDiagramAST): readonly Warning[] {
  return uniqueWarnings(ast.warnings ?? [], ignoredNoteWarnings(ast.events));
}

/** `geo` carrying the diagram's warnings, when it has any. */
export function withGeometryWarnings(geo: SequenceGeometry, ast: SequenceDiagramAST): SequencePluginGeometry {
  const warnings = sequenceWarnings(ast);
  return warnings.length === 0 ? geo : { ...geo, warnings };
}

/**
 * The banner over a rendered page -- `DiagramChromeFactory#addWarnings`, the
 * first chrome step (`DiagramChromeFactory.java:128`), drawn deferred into a
 * scaled page and formatted by the one export scale pass
 * (`core/skinparam-warnings.ts#withWarningBanner`, sdd3-T3b). Every page
 * `renderer-document.ts#preChromeDims` builds declares its margin-less block,
 * so `documentMarginOf` resolves for it; the `undefined` arm is the type's
 * (a hand-built fragment without a block), not a scaled-page skip.
 */
export function withSequenceWarningBanner(
  fragment: RenderFragment,
  warnings: readonly Warning[] | undefined,
  measurer: StringMeasurer,
): RenderFragment {
  const margin = documentMarginOf(fragment);
  if (warnings === undefined || margin === undefined) return fragment;
  return withWarningBanner(fragment, warnings, measurer, margin, BANNER_UID);
}
