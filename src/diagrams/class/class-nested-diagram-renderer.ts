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
 * NOT WIRED into any production call site as of this task (CDD T27) — see
 * `.agent-notes/cdd-T27.md` for exactly which additional, out-of-write-set
 * files (`src/diagrams/class/parser.ts#handlePendingBodyLine`, plus at
 * least one of the class-body geometry/render files) a follow-on task must
 * touch before a `class C { {{ ... }} }` body actually reaches this
 * renderer. This file is a real, standalone, unit-tested implementation of
 * the `NestedDiagramRenderer` contract, ready for that wiring and for T28's
 * chrome/legend path (`EmbeddedDiagram.ts`'s own "Interface out" note: any
 * caller may reuse this instance rather than build its own).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/EmbeddedDiagram.java:126-152,165-195,197-213
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
 * Builds a real `NestedDiagramRenderer` for the class engine: joins the
 * collected `@start.../@end...` lines (`EmbeddedDiagram.createAndSkip`'s
 * output) with `\n`, renders them through `renderFn`, strips the
 * `<?plantuml ...?>` PIs (java:199), and wraps the result as an `<image>`
 * sized from the nested SVG's own `viewBox`.
 *
 * Recursion guard (task item 3 — see {@link MAX_NESTED_DIAGRAM_DEPTH}'s doc
 * comment for why there is no upstream citation): `depth` is closed over
 * per renderer instance, incremented before calling `renderFn` and
 * decremented in `finally` — a `renderFn` that itself routes back through
 * THIS SAME renderer instance (the only way a class-body embed could ever
 * recurse, once wired into production) trips {@link EmbeddedDiagramDepthError}
 * instead of recursing unboundedly.
 */
export function createNestedDiagramRenderer(
  renderFn: RenderNestedDiagramFn,
  maxDepth: number = MAX_NESTED_DIAGRAM_DEPTH,
): NestedDiagramRenderer {
  let depth = 0;
  return {
    render(source: readonly string[]): TextBlock {
      if (depth >= maxDepth) throw new EmbeddedDiagramDepthError(maxDepth);
      depth++;
      try {
        const svg = stripPlantumlProcessingInstructions(renderFn(source.join('\n')));
        const dim = readSvgDimensions(svg);
        const href = `data:image/svg+xml;base64,${toBase64(new TextEncoder().encode(svg))}`;
        return embeddedTextBlock(dim, href);
      } finally {
        depth--;
      }
    },
  };
}
