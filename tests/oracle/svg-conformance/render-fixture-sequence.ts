/**
 * Shared low-level render helper for the svg-sequence conformance suite
 * (sequence-oracle-harness / T1).
 *
 * Mirrors `render-fixture-state.ts` procedurally — see that file's doc
 * comment for the rationale common to every one of these helpers (one
 * measurer instance injected into BOTH the layout and render stages; the
 * low-level pipeline rather than `renderSync`, so production's own measurer
 * default cannot leak into a conformance measurement). The one exception is
 * a nested `{{ }}` diagram: the nested-renderer seam renders it through
 * `renderSync` with the SAME measurer, as production's prepareBlock does.
 *
 * Sequence routes through its OWN dedicated engine
 * (`parseSequence` -> `layoutSequence` -> `renderSequence`,
 * `src/diagrams/sequence/index.ts`'s `sequencePlugin`), not a shared one —
 * unlike json/yaml/hcl's shared `layoutJson`/`renderJson` (`render-fixture-
 * json.ts`). `renderSequence`, like `renderState` and `renderClass`, takes
 * no `measurer` parameter of its own: every text metric it needs is already
 * baked into the `SequenceGeometry` `layoutSequence` produces, so the
 * measurer is injected once, at the layout stage, and reused (never
 * recreated) for the chrome stage below.
 *
 * Three deltas from `render-fixture-state.ts`, each because
 * `SequenceDiagramAST` differs structurally from `StateDiagramAST`:
 *
 *   1. NO MULTI-PAGE STRIPPING. `SequenceDiagramAST` has no `.pages` field
 *      (`src/diagrams/sequence/ast.ts`) — same absence state relies on, so
 *      the same no-op applies here (G2 N28's `render-fixture-class.ts`
 *      rationale does not apply to either engine).
 *   2. NO POST-CHROME DOCUMENT-MARGIN RE-APPLICATION. `renderSequence`
 *      (`src/diagrams/sequence/renderer.ts:433`) returns a `RenderFragment`
 *      literal that never sets `preChromeWidth` — confirmed by inspection:
 *      the object literal it returns has only `body`/`width`/`height`/
 *      `background`. `RenderFragment.preChromeWidth` is what gates
 *      `applyClassDocumentMargin` in `render-fixture-class.ts` and in
 *      `src/index.ts#applyAnnotationChrome`'s own generic (non-class)
 *      branch; an always-`undefined` field makes that branch a guaranteed
 *      no-op here too, so it is omitted rather than carried as dead code.
 *   3. THE PARSE TAKES THE WIDENED BLOCK (sdd1 D3). `parseSequence` takes
 *      the block's `UmlSource`, whose `styleSource`/`stylePositions` replay
 *      per command, so this helper widens `first.source` exactly as
 *      production's `src/index.ts#umlSourceOfBlock` does (the same widening
 *      `render-fixture-activity.ts` makes) — otherwise the ratchet would
 *      measure a style-less path production does not take (memory
 *      `conformance-harness-mirrors-index-ts`).
 *
 * `sprites` (parsed onto `SequenceDiagramAST`, `ast.ts:151`) is NOT
 * threaded through to geometry/render the way `render-fixture-class.ts`
 * threads it onto `geo.sprites` for `renderClass`'s actor/usecase icon
 * path: `renderSequence` never reads a `sprites` field (confirmed by
 * inspection of `src/diagrams/sequence/renderer.ts` — no `sprite` token
 * appears in it), so there is no consumer to wire it into here.
 */
import { buildBlockUmls, type BlockUmlOk } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { PreprocessOptions } from '../../../src/core/preprocessor.js';
import type { ParseOptions } from '../../../src/core/dispatcher.js';
import { buildTheme } from '../../../src/core/build-theme.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
import {
  sequenceWarnings,
  withSequenceWarningBanner,
  withSkinParamWarnings,
} from '../../../src/diagrams/sequence/sequence-warnings.js';
import { isEmpty } from '../../../src/core/annotations/index.js';
import { applyExportedChrome } from '../../../src/core/annotations/chrome-export.js';
import { resolveAnnotationStyles } from '../../../src/core/annotations/style.js';
import { assembleSvg, renderSync } from '../../../src/index.js';
import { registerNestedDiagramRenderers } from '../../../src/diagrams/class/class-nested-diagram-renderer.js';
import { seedOfUmlSource } from '../../../src/core/assemble-svg.js';

/** `renderFixtureSequence`'s own options bag: `PreprocessOptions` (forwarded
 *  to `buildBlockUmls`) UNION `ParseOptions` (`assetStore`, forwarded to
 *  `parseSequence` — D6, cdd6-T1c). Mirrors `render-fixture-class.ts`'s
 *  `FixtureClassOptions`. */
type FixtureSequenceOptions = PreprocessOptions & ParseOptions;

/** `src/index.ts#umlSourceOfBlock`'s widening of `block.source`, restricted
 *  to the fields `parseSequence` reads (sdd1 D3). Exported so a test can
 *  assert it hands the parser what production does. */
export function sequenceBlockSource(block: BlockUmlOk): UmlSource {
  const preprocessed = block.preprocessed;
  return {
    ...block.source,
    rawStyles: preprocessed.styles,
    stylePositions: preprocessed.stylePositions,
    skinparamAssignments: preprocessed.skinparamAssignments,
    styleSource: preprocessed,
  };
}

/** Renders a `.puml` fixture through the SEQUENCE engine's low-level
 * pipeline with `measurer` injected at the layout stage and reused
 * (never recreated) for the chrome stage. `options` (e.g. `{
 * includeStore }`) passes through to `buildBlockUmls` verbatim.
 * `options.assetStore` is forwarded separately to `parseSequence` (D6,
 * cdd6-T1c), mirroring `sequence/index.ts#sequencePlugin.parse`. Throws if
 * the markup contains no diagram block. */
export function renderFixtureSequence(
  markup: string,
  measurer: StringMeasurer,
  options?: FixtureSequenceOptions,
): string {
  // sdd2-T6d: registers the nested-diagram renderer as production does
  // (`src/index.ts` prepareBlock) and the activity harness does
  // (`render-fixture-activity.ts:121`); without it a note's `{{ }}`
  // `EmbeddedDiagram.drawU` hits its "no renderer registered" path.
  registerNestedDiagramRenderers((source) => renderSync(source, { measurer }));
  const blocks = buildBlockUmls(markup, options);
  const first = blocks[0];
  if (first === undefined) throw new Error('no diagram block found');
  if (!first.ok) throw first.failure.cause;

  const preprocessed = first.preprocessed;
  // cdd4-T7b: the shipped `buildTheme`, not a copy of it -- a copy measured a
  // path no shipped code takes once theme styling moved into it.
  const { theme, styleMap } = buildTheme(preprocessed);
  const parsed = parseSequence(sequenceBlockSource(first), { assetStore: options?.assetStore });
  // T4: `parseSequence` now returns `SequenceDiagramAST | ParseRefusal`
  // (D1). This harness bypasses `src/index.ts`'s production narrowing (it
  // drives the engine directly), so a refusal surfaces the same way
  // `tests/helpers/parse-ast.ts` does for plugin-level callers: thrown,
  // naming line/kind/message, rather than silently swallowed.
  if ('refused' in parsed) {
    throw new Error(`sequence refused this source at line ${String(parsed.line)} (${parsed.kind}): ${parsed.message}`);
  }
  // sdd2-T7e: mirrors `sequence/index.ts#sequencePlugin` (skinparam warnings
  // at parse, the banner at render; `sequence-warnings.ts`).
  const ast = withSkinParamWarnings(parsed, preprocessed.skinparam);
  const geo = layoutSequence(ast, theme, measurer);
  const fragment = withSequenceWarningBanner(renderSequence(geo, theme, measurer), sequenceWarnings(ast), measurer);

  // sdd1 close-b2 (journal row 40): seed every `<linearGradient>`/`<filter>`
  // id as production does -- `src/index.ts` passes `seedOfUmlSource(
  // umlSource)` to `assembleSvg` (upstream `UmlSource#seed()`,
  // `SvgGraphics.java:160-162`); the activity harness mirrors it the same
  // way (`render-fixture-activity.ts`). Unseeded, 8 fixtures read conformant
  // in the survey and diverged here on `@id` alone.
  const seed = seedOfUmlSource({
    lines: first.source.lines,
    rawSourceLines: first.rawSource.map((s) => s.getString()),
    seedSourceLines: first.seedSource,
  });

  const annotations = ast.annotations;
  if (annotations === undefined || isEmpty(annotations)) return assembleSvg(fragment, seed);

  const styles = resolveAnnotationStyles(theme, preprocessed, styleMap);
  const chromed = applyExportedChrome(fragment, annotations, styles, measurer, ast.sprites);
  return assembleSvg(chromed, seed);
}
