/**
 * class-nested-diagram-renderer.ts — CDD T27: a real `NestedDiagramRenderer`
 * (`core/EmbeddedDiagram.ts`'s injected seam, `EmbeddedDiagram.ts:195-197`)
 * built in the class engine's own code, per that file's own doc comment
 * ("never inside `EmbeddedDiagram.ts` itself, which stays diagram-type-
 * agnostic").
 *
 * Mirrors upstream's NON-TeaVM SVG branch — `EmbeddedDiagram
 * #calculateDimensionSlow`'s `stringBounder.matchesProperty("SVG")` arm
 * (java:129-133: renders the nested diagram, wraps it as a `UImageSvg`,
 * reports ITS width/height) and `drawU`'s matching `isSvg` arm (java:
 * 169-174: `ug.draw(svg)`), NOT the TeaVM `getInternalTextBlock` branch
 * `core/EmbeddedDiagram.ts`'s own module doc comment ports — this port's
 * oracle is the real jar CLI (`-tsvg`), which is non-TeaVM and always takes
 * the SVG-format arm; `getImageSvg`/`getImageSvgSlow` (java:197-213) are the
 * render-then-strip step {@link createNestedDiagramRenderer} reproduces:
 * `diagram.exportDiagram(...)` then `replaceAll("<\\?plantuml.+?\\?>", "")`
 * (java:199).
 *
 * D9 (decisions.md): element presence + dimensions are the target; the
 * payload BYTES are a declared divergence (DIVERGENCES.md, mirroring the
 * "Sprite and `img` rasters" entry) — the jar re-encodes a rasterized
 * image, this port embeds the recursively-rendered SVG SOURCE directly,
 * base64-encoded with `klimt/sprite/png-encoder.ts#toBase64` (the SAME RFC
 * 4648 encoder the sprite/img raster path already uses, reused here for
 * arbitrary UTF-8 text rather than PNG bytes).
 *
 * `renderFn` is INJECTED, never imported directly from `src/index.js`:
 * `src/index.ts` imports the class engine (via the plugin registry) to
 * support `@startuml`/class dispatch, so a direct import the other
 * direction — `src/diagrams/class/*.ts` -> `src/index.js` -> (plugin
 * registry) -> `src/diagrams/class/*.ts` — would be a real circular
 * import. `core/EmbeddedDiagram.ts`'s own module doc comment documents the
 * identical seam for exactly this reason ("the callback-seam architecture
 * note"); this file mirrors that resolution one level down.
 *
 * CDD T27FU (follow-on, wired): now the real seam for TWO consumers —
 * `core/cucadiagram/MethodsOrFieldsArea.ts`'s `NestedDiagramRenderer`
 * contract (`render`, returns a `TextBlock`) AND the class engine's OWN
 * enhanced-body pipeline (`class-body-enhanced-layout.ts`, `renderImage`,
 * returns plain `{width, height, href}` — that engine has no `TextBlock`/
 * `UGraphic` model at all, see {@link RenderedEmbeddedImage}'s own doc
 * comment). Both share ONE depth-guarded render path ({@link
 * createNestedDiagramRenderer}'s `guardedRender`). `registerClassNested
 * DiagramRenderer`/`getClassNestedDiagramRenderer` are the module-level
 * registration slot `src/index.ts` populates once with its own `renderSync`
 * — see that function's own doc comment for why a plain parameter cannot
 * reach `class-body-enhanced-layout.ts` (the `layoutSync(ast, theme,
 * measurer): Geo` plugin interface, `core/dispatcher.ts:207`, is shared by
 * every diagram type and is not this task's to widen).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/EmbeddedDiagram.java:126-152,165-195,197-213
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:109-123,141-152,429-440
 */
import { UImage } from '../../core/klimt/shape/UImage.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { toBase64 } from '../../core/klimt/sprite/png-encoder.js';
import type { NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';

/**
 * Task item 3 (CDD T27): a block embedding itself, directly or via a cycle,
 * throws this rather than recursing until the JS call stack overflows.
 *
 * // on-call: if a block embeds itself, renderSync throws
 * EmbeddedDiagramDepthError rather than recursing; no runbook — fix the
 * fixture.
 */
export class EmbeddedDiagramDepthError extends Error {
  constructor(maxDepth: number) {
    super(`EmbeddedDiagram: nested-diagram recursion exceeded ${maxDepth} levels — a block likely embeds itself`);
    this.name = 'EmbeddedDiagramDepthError';
  }
}

/**
 * Port-introduced safety net, not an upstream constant — no `file:line`
 * citation exists because upstream has none: a self-embedding `{{ }}` block
 * recurses through the JVM's own call stack until IT overflows (an
 * uncontrolled `StackOverflowError`, not a designed limit). This port's
 * `renderSync` is a plain synchronous JS call stack with the identical
 * failure mode, so this task (item 3) introduces an explicit, named bound
 * instead of relying on the runtime's own stack limit (which varies by
 * engine and is not a safe, portable failure signal).
 */
export const MAX_NESTED_DIAGRAM_DEPTH = 24;

/**
 * `getImageSvg` (java:197-203): `replaceAll("<\\?plantuml.+?\\?>", "")`.
 * Java's `String#replaceAll` compiles with no flags, so `.` does NOT match a
 * line terminator (no DOTALL) — this only removes single-line processing
 * instructions, matching every `<?plantuml ...?>`/`<?plantuml-src ...?>` PI
 * this port's own `renderSync` emits (`core/svg.ts#svgRoot`'s single-line
 * `<?plantuml $version$?>`, `<?plantuml-src ...?>`).
 */
function stripPlantumlProcessingInstructions(svg: string): string {
  return svg.replace(/<\?plantuml.+?\?>/g, '');
}

/**
 * `viewBox="0 0 W H"` is present on every SVG this port's `renderSync`
 * emits (`core/svg.ts#svgRoot`) — read from there rather than the
 * `width`/`height` attributes, which carry a `px` suffix this port's own
 * output (unlike the jar's inner embedded payload) always includes.
 */
function readSvgDimensions(svg: string): XDimension2D {
  const match = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (match === null) {
    throw new Error('class-nested-diagram-renderer: rendered SVG has no viewBox="0 0 W H" to measure');
  }
  return new XDimension2D(Number(match[1]), Number(match[2]));
}

/**
 * A `TextBlock` that reports the nested render's own dimensions and draws
 * it as one SVG `<image>` — `UImage` + `DriverImageSvg`, the SAME machinery
 * DIVERGENCES.md's "Sprite and `img` rasters" entry already documents, never
 * a `PortableImage`/raster (this port is browser-only, no AWT/ImageIO).
 */
function embeddedTextBlock(dim: XDimension2D, href: string): TextBlock {
  const image = UImage.build(dim.getWidth(), dim.getHeight(), href);
  return {
    calculateDimension(_stringBounder: StringBounder): XDimension2D {
      return dim;
    },
    drawU(ug: UGraphic): void {
      ug.draw(image);
    },
  };
}

/**
 * A `renderSync`-shaped callback — see the module doc comment for why this
 * is injected rather than imported directly.
 */
export type RenderNestedDiagramFn = (source: string) => string;

/**
 * The class engine's OWN plain-data result shape — that engine sizes/draws
 * with plain numbers and `core/svg.ts` string builders, never `TextBlock`/
 * `UGraphic` (see this file's own module doc comment). `href` is present
 * whenever the render actually succeeded; a caller that gets an image with
 * NO `href` (this file never returns that shape — the class engine's own
 * catch-and-fallback, `class-body-enhanced-layout.ts`, builds it) reserves
 * the space but draws nothing, matching `EmbeddedDiagram.java:148-152`'s
 * OWN split contract (`calculateDimensionSlow` degrades to a fixed size on
 * failure; `drawU`, a SEPARATE catch, degrades to drawing nothing).
 */
export interface RenderedEmbeddedImage {
  readonly width: number;
  readonly height: number;
  readonly href: string;
}

/** Both `render` (the `NestedDiagramRenderer` contract) and `renderImage`
 *  (the class engine's own plain-data contract) share ONE depth-guarded
 *  render path — see {@link createNestedDiagramRenderer}'s own doc comment. */
export interface EmbeddedRenderer extends NestedDiagramRenderer {
  renderImage(source: readonly string[]): RenderedEmbeddedImage;
}

/**
 * Builds a real embedded-diagram renderer: joins the collected
 * `@start.../@end...` lines (`EmbeddedDiagram.createAndSkip`'s output, or
 * `class-body-enhanced-layout.ts`'s own equivalent wrap) with `\n`, renders
 * them through `renderFn`, strips the `<?plantuml ...?>` PIs (java:199),
 * and measures the result from its own `viewBox`. `render` wraps that as a
 * `TextBlock`-drawn `<image>` (`core/cucadiagram/MethodsOrFieldsArea.ts`'s
 * consumer); `renderImage` returns the SAME `{width, height, href}` plain
 * data directly (the class engine's own consumer, `class-body-enhanced-
 * layout.ts`).
 *
 * Recursion guard (task item 3 — see {@link MAX_NESTED_DIAGRAM_DEPTH}'s doc
 * comment for why there is no upstream citation): `depth` is MODULE-LEVEL,
 * not closed over per instance, incremented before calling `renderFn` and
 * decremented in `finally`. This matters in production because `src/index
 * .ts#prepareBlock` calls `registerClassNestedDiagramRenderer` again on
 * EVERY `renderSync` call, including every RECURSIVE one a `{{ }}` block
 * triggers (needed so each nested render sees the correct ambient
 * `options`/measurer, `prepareBlock`'s own doc comment) — a per-INSTANCE
 * counter would reset to 0 on each of those re-registrations and never
 * actually bound anything. Sharing one module-level counter across every
 * instance correctly tracks true nesting depth regardless of how many
 * renderer instances were created along the way; JS's single-threaded,
 * fully-synchronous `renderSync` call chain (no interleaving) makes this
 * safe, and every real recursion fully unwinds the counter back to 0 via
 * `guardedRender`'s own `finally` before the top-level `renderSync` call
 * returns (a throw included), so no state leaks across unrelated render
 * calls or test cases. A `renderFn` that routes back through the
 * registered renderer (the only way a class-body embed can ever recurse,
 * now that it is wired into production) trips {@link
 * EmbeddedDiagramDepthError} instead of recursing unboundedly. Both
 * `render` and `renderImage` funnel through the ONE `guardedRender` closure
 * below, so a cycle through either entry point is caught by the SAME
 * counter.
 */
let embedDepth = 0;

export function createNestedDiagramRenderer(
  renderFn: RenderNestedDiagramFn,
  maxDepth: number = MAX_NESTED_DIAGRAM_DEPTH,
): EmbeddedRenderer {
  function guardedRender(source: readonly string[]): RenderedEmbeddedImage {
    if (embedDepth >= maxDepth) throw new EmbeddedDiagramDepthError(maxDepth);
    embedDepth++;
    try {
      const svg = stripPlantumlProcessingInstructions(renderFn(source.join('\n')));
      const dim = readSvgDimensions(svg);
      const href = `data:image/svg+xml;base64,${toBase64(new TextEncoder().encode(svg))}`;
      return { width: dim.getWidth(), height: dim.getHeight(), href };
    } finally {
      embedDepth--;
    }
  }
  return {
    render(source: readonly string[]): TextBlock {
      const img = guardedRender(source);
      return embeddedTextBlock(new XDimension2D(img.width, img.height), img.href);
    },
    renderImage: guardedRender,
  };
}

/**
 * The module-level registration slot `src/index.ts` populates once (where
 * the class plugin is registered) with a `renderSync`-shaped callback — see
 * this file's own module doc comment for why a plain parameter cannot reach
 * `class-body-enhanced-layout.ts` from there. `class-body-enhanced-layout
 * .ts` reads this ONLY when its own `EnhancedLayoutCtx.nestedRenderer` is
 * absent (DI-first: an explicit ctx value, e.g. from a test, always wins),
 * so no test needs to touch this global to exercise the embed pipeline.
 */
let registeredRenderer: EmbeddedRenderer | undefined;

/** Called once by `src/index.ts`, right where `classPlugin` is registered. */
export function registerClassNestedDiagramRenderer(
  renderFn: RenderNestedDiagramFn,
  maxDepth: number = MAX_NESTED_DIAGRAM_DEPTH,
): void {
  registeredRenderer = createNestedDiagramRenderer(renderFn, maxDepth);
}

/** `undefined` until `registerClassNestedDiagramRenderer` has run (e.g. a
 *  test that imports this module directly, bypassing `src/index.ts`) — a
 *  caller with no explicit `ctx.nestedRenderer` degrades to the
 *  `EmbeddedDiagram.java:148-152` fixed-size fallback in that case, exactly
 *  as it does for a renderer that throws. */
export function getClassNestedDiagramRenderer(): EmbeddedRenderer | undefined {
  return registeredRenderer;
}
