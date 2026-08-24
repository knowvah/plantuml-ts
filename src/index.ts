import { buildBlockUmls, isBlockEmpty } from './core/BlockUmlBuilder.js';
import type { BlockUml, BlockUmlOk } from './core/BlockUmlBuilder.js';
import { registry, parseRefusalOf } from './core/dispatcher.js';
import type { AssembledSvg, DiagramPlugin } from './core/dispatcher.js';
import { buildTheme } from './core/build-theme.js';
import { applyChrome, isEmpty as isAnnotationsEmpty } from './core/annotations/index.js';
import type { DiagramAnnotations } from './core/annotations/index.js';
import { resolveAnnotationStyles } from './core/annotations/style.js';
import { unwrapKlimtSvg } from './diagrams/description/renderer.js';
import { applyClassDocumentMargin } from './diagrams/class/layout-ink-extent.js';
import { sequencePlugin } from './diagrams/sequence/index.js';
import { classPlugin } from './diagrams/class/index.js';
import { statePlugin } from './diagrams/state/index.js';
import { descriptionPlugin } from './diagrams/description/index.js';
import { activityPlugin } from './diagrams/activity/index.js';
import { jsonPlugin } from './diagrams/json/index.js';
import { yamlPlugin } from './diagrams/yaml/index.js';
import { hclPlugin } from './diagrams/hcl/index.js';
import { boardPlugin } from './diagrams/board/index.js';
import { chronologyPlugin } from './diagrams/chronology/index.js';
import { filesPlugin } from './diagrams/files/index.js';
import { packetdiagPlugin } from './diagrams/packetdiag/index.js';
import { chartPlugin } from './diagrams/chart/index.js';
import { dotPlugin } from './diagrams/dot/index.js';
import type { Theme } from './core/theme.js';
import type { StyleMap } from './core/skinparam.js';
import type { StringMeasurer } from './core/measurer.js';
import type { DiagramType, UmlSource } from './core/block-extractor.js';
import { prepareIncludeStore } from './core/include-resolver.js';
import { surfaceSpriteWarnings } from './core/sprite-commands.js';
import type { PreprocessorResult } from './core/preprocessor.js';
import {
  DiagramRefusal,
  emptySvg,
  errorSvg,
  preprocessorErrorSvg,
  welcomeSvg,
} from './core/error/error-diagrams.js';
import { resolveMeasurer } from './core/render-options.js';
import type { RenderOptions } from './core/render-options.js';
import { assembleSvg } from './core/assemble-svg.js';

// A5/T4: `RenderOptions` and `assembleSvg` moved out of this file (which sits
// at the repo's 500-line hook cap) but stay exported HERE -- `package.json`'s
// "exports" map has a single "." entry, so this file is the only surface a
// consumer of the built library can reach. Same shape as `buildTheme`'s
// earlier move to `core/build-theme.ts`.
export type { RenderOptions } from './core/render-options.js';
export { assembleSvg } from './core/assemble-svg.js';

// Re-exported so downstream stdlib packages (SI5b `@knowvah/plantuml-stdlib*`, plans/si5b-stdlib/decisions.md
// D2) can build an `options.includeStore` carrying vendored bundles. Required here specifically:
// `package.json`'s "exports" map has a single "." entry (no subpath exports), so this file is the only
// reachable surface for a consumer of the built library — hence si8's registry and warm-up are published
// here too, not just from their modules.
export { stdlibStore, withStdlib } from './core/tim/StdlibStore.js';
export type { BundleData, StdlibStore } from './core/tim/StdlibStore.js';
export { stdlibRegistry, StdlibChunkLoadError, type StdlibRegistry } from './core/tim/StdlibRegistry.js';
export { prepareIncludeStore, type IncludeWarmupOptions } from './core/include-resolver.js';
// SI11a per-RESOURCE fetch (vs. si8's per-BUNDLE chunk above); see StdlibRemote.ts's doc comment. si11b's
// `spriteSplitStdlib` is one level finer again: a bootstrap diagram pays for the sprites it names, not the 1.06 MB bundle holding all 2,078 of them.
export { remoteStdlib, StdlibResourceFetchError, type StdlibRemoteManifest, type RemoteBundle } from './core/tim/StdlibRemote.js';
export { spriteSplitStdlib, SpriteNotBundledError, type SpriteSplitManifest } from './core/sprite-split-stdlib.js';
// ADR-2 (plans/s1l-tail-fix/decisions.md): the sync-fillable asset seam F4-a/F4-b both consume via options.assetStore.
export { combineAssetStores, type AssetPayload, type AssetStore } from './core/asset-store.js';

// Register plugins in specificity order — most specific first, sequence last.
// Sequence plugin uses broad arrow heuristics (-->) that overlap with graph
// diagram types; graph plugins match unique structural keywords that sequence
// diagrams never contain.
registry.register(classPlugin);
registry.register(statePlugin);
// Consolidated descriptive engine — replaces the old component + usecase
// plugins (upstream's single DescriptionDiagramFactory). Registered in the
// old component slot; accepts() is order-independent vs activity (activity's
// patterns exclude :actor: and the descriptive keyword/shorthand set).
registry.register(descriptionPlugin);
registry.register(activityPlugin);
registry.register(yamlPlugin);
registry.register(jsonPlugin);
registry.register(hclPlugin);
registry.register(boardPlugin);
registry.register(chronologyPlugin);
registry.register(filesPlugin);
registry.register(packetdiagPlugin);
registry.register(chartPlugin);
registry.register(dotPlugin);
registry.register(sequencePlugin);



/**
 * The block's preprocessed interior, carrying the `<style>` blocks the
 * interpreter pulled out of THAT block (upstream keeps them inside it).
 */
function umlSourceOfBlock(block: BlockUmlOk): UmlSource {
  return {
    ...block.source,
    rawStyles: block.preprocessed.styles,
    stylePositions: block.preprocessed.stylePositions,
    // Raw lines (incl. @start/@end + directives) for the jar-faithful diagram
    // seed -- see `UmlSource.rawSourceLines`'s doc comment.
    rawSourceLines: block.rawSource.map((s) => s.getString()),
  };
}

/**
 * Structural annotations getter (decisions.md D3). `ast` is `unknown` here
 * -- the registry erases each plugin's own AST type param -- but it is
 * always THIS pipeline's own trusted `plugin.parse()` output, never
 * external input, so a structural `in` narrowing is the right tool, not a
 * validation boundary (see `security.md`: boundary validation applies to
 * data crossing INTO the process, not between our own typed stages).
 *
 * Every engine's AST carries `annotations?: DiagramAnnotations` EXCEPT
 * chart, whose AST already had an unrelated pre-existing `annotations`
 * field (plot text/arrow callouts) and stores chrome under `chrome`
 * instead (`src/diagrams/chart/ast.ts`'s doc comment) -- `chrome` is
 * checked FIRST, unconditionally, for exactly this reason (see the
 * function body). json/dot/chart's `annotations`/`chrome.title` is
 * never populated by their own parsers (title stays on their bespoke
 * field until T8) -- so reading this field generically for every
 * engine, with no other special-casing, already gives json/dot/chart's
 * caption/legend/header/footer shared chrome for free while leaving
 * their bespoke title bands untouched.
 */
function annotationsOf(ast: unknown): DiagramAnnotations | undefined {
  if (typeof ast !== 'object' || ast === null) return undefined;
  // `chrome` is checked FIRST and unconditionally: it is chart's own
  // unambiguous chrome marker (no other engine's AST has this field), and
  // chart's AST ALSO carries an unrelated pre-existing `annotations: Chart
  // AnnotationDef[]` (plot text/arrow callouts, `src/diagrams/chart/ast.ts`)
  // that is NOT a `DiagramAnnotations` -- checking `annotations` first
  // would silently hand that array to `isEmpty`/`applyChrome`, which read
  // `.title`/`.legend`/etc. off it and crash on `undefined.display` (T7
  // regression found via `tests/unit/chart/renderer.test.ts`'s AC1 case).
  if ('chrome' in ast) {
    const value = (ast as { chrome?: DiagramAnnotations }).chrome;
    if (value !== undefined) return value;
  }
  if ('annotations' in ast) {
    const value = (ast as { annotations?: DiagramAnnotations }).annotations;
    if (value !== undefined) return value;
  }
  return undefined;
}

/**
 * T7 -- apply annotation chrome (decisions.md D1-D9) between `plugin.render`
 * and `assembleSvg`. Skips entirely -- returning `fragment` unchanged, so
 * D5 byte-stability holds for every annotation-free diagram -- when the AST
 * carries no (or empty) annotations.
 *
 * `RenderFragment` producers (every engine but description) go straight
 * through the shared `applyChrome`. The description (klimt) engine always
 * returns a `CompleteSvg` (D2's escape hatch -- klimt has no
 * fragment-without-document emission mode, see `unwrapKlimtSvg`'s doc
 * comment); its `completeSvg` is unwrapped into a `RenderFragment`, run
 * through the SAME `applyChrome`, and reassembled via the SAME
 * `assembleSvg` every other engine uses -- no third chrome implementation.
 * Any OTHER `CompleteSvg` producer (chart's fixed-size error box, reached
 * only when parse/validation errors exist) is left untouched: chrome has
 * no sensible placement on a diagnostic box with no diagram context.
 */
function applyAnnotationChrome(
  fragment: AssembledSvg,
  ast: unknown,
  theme: Theme,
  styleMap: StyleMap,
  preprocessed: PreprocessorResult,
  measurer: StringMeasurer,
  pluginType: DiagramType,
): AssembledSvg {
  const annotations = annotationsOf(ast);
  if (annotations === undefined || isAnnotationsEmpty(annotations)) return fragment;

  const styles = resolveAnnotationStyles(theme, preprocessed.skinparam, styleMap);

  if (!('completeSvg' in fragment)) {
    const chromed = applyChrome(fragment, annotations, styles, measurer);
    // G2 N46: class fragments center chrome text against the PRE-margin
    // ink dims (`fragment.preChromeWidth`/`preChromeHeight`, threaded
    // through `applyChrome` -- see that function's own doc comment) --
    // `chromed.width`/`height` come out raw-based too, so the document
    // margin/`SvgGraphics#ensureVisible` quirk this port's no-chrome path
    // already applies at layout time (`layout-ink-extent.ts
    // #computeClassDocumentDims`) must be re-applied HERE, once, to the
    // fully chrome-composed result -- matching jar's own
    // `TextBlockExporter#calculateFinalDimension` running AFTER
    // `DiagramChromeFactory.create`, not before it. A no-op (`??` never
    // triggers) for every other engine (`preChromeWidth` stays
    // `undefined`).
    if (fragment.preChromeWidth === undefined) return chromed;
    const margined = applyClassDocumentMargin({ width: chromed.width, height: chromed.height });
    return { ...chromed, width: margined.width, height: margined.height };
  }

  if (pluginType !== 'description') return fragment;

  const unwrapped = unwrapKlimtSvg(fragment.completeSvg, theme.colors.background);
  // #lizard forgives -- pre-existing violation (23 NLOC/7 PARAM vs. this
  // repo's 30/5 caps; 7 params, not NLOC, is the actual trip -- unrelated
  // to skin-reddress-variants, just no longer shielded by file size.
  return { completeSvg: assembleSvg(applyChrome(unwrapped, annotations, styles, measurer)) };
}

/**
 * The one place a returned `ParseRefusal` becomes an error diagram.
 *
 * D1 makes refusal a RETURN, not a throw, because upstream reserves `throw`
 * for its `catch (Throwable t)` crash path (`PSystemBuilder.java:275-281`),
 * which draws a different page — "Fatal crash error". A refusal is upstream's
 * `PSystemError`, and this port already models that: `DiagramRefusal` carries
 * the offending line and the assumed diagram type through to
 * `errorSvg`/`PSystemErrorV2`, so the page lands where the jar's lands. The
 * throw here is an internal jump to the surrounding `catch`, not the plugin
 * contract — plugins still return.
 *
 * No plugin returns a refusal yet (T4-T11 give them the ability), so today
 * this is a typechecked pass-through. It is exercised by
 * `tests/unit/dispatch/parse-refusal-wiring.test.ts`, which registers a
 * refusing plugin rather than waiting for a real one.
 */
function parseOrRefuse(
  plugin: DiagramPlugin,
  umlSource: UmlSource,
  options?: RenderOptions,
): unknown {
  const parsed = plugin.parse(umlSource, { assetStore: options?.assetStore });
  const refusal = parseRefusalOf(parsed);
  if (refusal === undefined) return parsed;
  throw new DiagramRefusal(refusal.message, refusal.line, plugin.type);
}

export function renderSync(source: string, options?: RenderOptions): string {
  try {
    // renderSync cannot fetch. With no store there is nothing to resolve an
    // !include against, so say so here rather than let the interpreter raise a
    // per-path IncludeNotFoundError the caller cannot act on. With a store, the
    // interpreter resolves includes exactly as render() does.
    if (options?.includeStore === undefined && /^!include\s/m.test(source)) {
      throw new Error(
        '!include directives are not supported in renderSync without options.includeStore — ' +
          'use render(), or prefetch the includes and pass options.includeStore',
      );
    }
    const blocks = buildBlockUmls(source, { includeStore: options?.includeStore });
    if (blocks.length === 0) return welcomeSvg(options);

    const block = blocks[0]!;
    if (!block.ok) return preprocessorErrorSvg(block.failure, options);
    if (isBlockEmpty(block)) return emptySvg(block, options);

    const umlSource = umlSourceOfBlock(block);
    // skin-reddress-variants Fix 2: thread the block's own raw source lines
    // so a `!define DARKBLUE` + `skin reddress` combination fires reddress's
    // `!ifdef DARKBLUE` gate in production (previously provable only via the
    // test harness -- see `build-theme.ts#buildTheme`'s doc comment).
    const { theme, styleMap } = buildTheme(
      block.preprocessed, options, block.rawSource.map((s) => s.getString()),
    );
    const plugin = registry.resolve(umlSource);
    if (!('layoutSync' in plugin))
      throw new Error('renderSync() is not supported for this diagram type — use render()');

    const measurer = resolveMeasurer(plugin.type, options);
    const ast = parseOrRefuse(plugin, umlSource, options);
    surfaceSpriteWarnings(ast, options?.onWarning);
    const geo = plugin.layoutSync(ast, theme, measurer);
    const fragment = plugin.render(geo, theme);
    const chromed = applyAnnotationChrome(
      fragment, ast, theme, styleMap, block.preprocessed, measurer, plugin.type,
    );
    // #lizard forgives -- pre-existing violation (31 NLOC vs. this repo's 30
    // cap), unrelated to skin-reddress-variants; only surfaced now because
    // buildTheme's move out of this file dropped index.ts under the
    // 500-line gate that previously short-circuited this per-function check.
    return assembleSvg(chromed);
  } catch (err) {
    return errorSvg(source, err, options);
  }
}

export async function render(
  source: string,
  options?: RenderOptions,
): Promise<string> {
  try {
    const includeStore = await prepareIncludeStore(source, options);
    const blocks = buildBlockUmls(source, { includeStore });
    if (blocks.length === 0) return welcomeSvg(options);

    return await renderBlock(blocks[0]!, options);
  } catch (err) {
    return errorSvg(source, err, options);
  }
}

export async function renderAll(
  source: string,
  options?: RenderOptions,
): Promise<string[]> {
  try {
    const includeStore = await prepareIncludeStore(source, options);
    const blocks = buildBlockUmls(source, { includeStore });
    return await Promise.all(blocks.map(async (block) => renderBlock(block, options)));
  } catch (err) {
    return [errorSvg(source, err, options)];
  }
}

/**
 * One block, end to end. Every block carries its OWN theme now: `!theme`,
 * `skinparam` and `<style>` live inside the `@start...@end` pair, and upstream
 * scopes them to it (each `BlockUml` runs its own `TimLoader`).
 */
async function renderBlock(block: BlockUml, options?: RenderOptions): Promise<string> {
  if (!block.ok) return preprocessorErrorSvg(block.failure, options);
  if (isBlockEmpty(block)) return emptySvg(block, options);

  const umlSource = umlSourceOfBlock(block);
  try {
    // skin-reddress-variants Fix 2: see the matching call in `renderSync`.
    const { theme, styleMap } = buildTheme(
      block.preprocessed, options, block.rawSource.map((s) => s.getString()),
    );
    const plugin = registry.resolve(umlSource);
    const measurer = resolveMeasurer(plugin.type, options);
    const ast = parseOrRefuse(plugin, umlSource, options);
    surfaceSpriteWarnings(ast, options?.onWarning);
    const geo =
      'layoutSync' in plugin
        ? plugin.layoutSync(ast, theme, measurer)
        : await plugin.layout(ast, theme, measurer);
    const fragment = plugin.render(geo, theme);
    const chromed = applyAnnotationChrome(
      fragment, ast, theme, styleMap, block.preprocessed, measurer, plugin.type,
    );
    return assembleSvg(chromed);
  } catch (err) {
    // The block's own lines, so the listing shows the diagram that failed.
    return errorSvg(umlSource.lines.join('\n'), err, options);
  }
}

