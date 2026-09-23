/**
 * class-body-enhanced-embeds.ts — the embedded-`{{ }}`-diagram half of
 * `class-body-enhanced-layout.ts#buildRowsBlockRows`, split out purely to
 * stay under this project's 500-line file cap (mirrors `class-body-
 * enhanced-geometry.ts`'s own identical split precedent from the SAME
 * parent file — no behavior change, pure move plus the CDD T27FU addition
 * itself).
 *
 * Ports `MethodsOrFieldsArea`'s constructor loop (java:109-123: separates
 * embedded blocks out of a member list) and its dimension/draw split
 * (java:141-152's `y += dim.getHeight()` stacking, `:429-440`'s matching
 * draw-order translate) for the class engine's OWN raw-line body model.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:109-123,141-152,429-440
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/EmbeddedDiagram.java:97-115,148-152
 */
import { EmbeddedDiagram, getEmbeddedType } from '../../core/EmbeddedDiagram.js';
import { scanEmbeddedElementBlock } from './class-embedded-block.js';
import {
  getClassNestedDiagramRenderer,
  EmbeddedDiagramDepthError,
  type EmbeddedRenderer,
} from './class-nested-diagram-renderer.js';

/**
 * One `{{ }}` block's rendered geometry, stacked below a rows-block's own
 * member rows (`MethodsOrFieldsArea.java:141-152`'s dimension, `:429-440`'s
 * draw order) -- `y` is LOCAL to the enclosing part's own coordinate space,
 * same convention as `ClassifierGeo['rows'][number].y`. `href` is absent
 * only on the `EmbeddedDiagram.java:148-152` fixed-size fallback (no
 * renderer registered, or the renderer threw) -- the space is reserved but
 * nothing is drawn, matching that method's own `drawU` catch (java:191-193)
 * failing independently and drawing nothing.
 */
export interface EmbeddedBlockGeo {
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly href?: string;
}

/**
 * `MethodsOrFieldsArea`'s constructor loop (java:109-123): separates a
 * rows-block's raw lines into surviving member lines and each `{{ }}`
 * block's WRAPPED `@start<type>/.../@end<type>` source, ready to render.
 * Reuses `class-embedded-block.ts#scanEmbeddedElementBlock` (this task's
 * OWN write-set, already correct and already nesting-aware) for the scan
 * itself rather than a second copy of the same algorithm -- that helper's
 * returned `block` is INCLUSIVE of the literal `{{`/`}}` opener+closer
 * lines, so {@link wrapEmbeddedSource} strips them and substitutes upstream's
 * synthetic `@start<type>`/`@end<type>` pair, matching `EmbeddedDiagram
 * .createAndSkip` (java:97-115) exactly, including its unterminated-block
 * case (no closer found -- nothing is stripped off the end either, java's
 * own `while (it.hasNext())` never drops a trailing line).
 */
export function extractEmbeds(lines: readonly string[]): { memberLines: string[]; embedSources: string[][] } {
  const memberLines: string[] = [];
  const embedSources: string[][] = [];
  let i = 0;
  while (i < lines.length) {
    const type = getEmbeddedType(lines[i]!);
    if (type === null) {
      memberLines.push(lines[i]!);
      i++;
      continue;
    }
    const { block, consumed } = scanEmbeddedElementBlock(lines, i);
    embedSources.push(wrapEmbeddedSource(type, block));
    i += consumed;
  }
  return { memberLines, embedSources };
}

/** See {@link extractEmbeds}'s own doc comment for why the closer is only
 *  stripped when one was actually found. */
function wrapEmbeddedSource(type: string, block: readonly string[]): string[] {
  const last = block.at(-1);
  const hasCloser = block.length > 1 && last !== undefined && last.trim() === EmbeddedDiagram.EMBEDDED_END;
  const body = hasCloser ? block.slice(1, -1) : block.slice(1);
  return [`@start${type}`, ...body, `@end${type}`];
}

/** `EmbeddedDiagram.java:150-152`'s own fixed-size catch fallback -- not an
 *  upstream constant to cite differently, this IS the literal upstream
 *  value, reused here for the class engine's own no-renderer/render-failure
 *  case. A recursion-guard trip ({@link EmbeddedDiagramDepthError}) is
 *  RE-THROWN, never swallowed into this fallback -- task item 3's own
 *  contract ("throws ... rather than recursing") means a self-embedding
 *  block is malformed input the caller must fix, not a transient render
 *  failure to hide. */
const EMBEDDED_FALLBACK_SIZE = 42;

function renderEmbed(source: readonly string[], renderer: EmbeddedRenderer | undefined): Omit<EmbeddedBlockGeo, 'y'> {
  if (renderer === undefined) return { width: EMBEDDED_FALLBACK_SIZE, height: EMBEDDED_FALLBACK_SIZE };
  try {
    return renderer.renderImage(source);
  } catch (err) {
    if (err instanceof EmbeddedDiagramDepthError) throw err;
    // Upstream: `catch (Exception e) { Logme.error(e); }` (java:148-150) --
    // logged, not silently swallowed, matching `core/EmbeddedDiagram.ts`'s
    // identical established convention for this exact fallback.
    console.error('measureEnhancedBody: nested-diagram render failed', err);
    return { width: EMBEDDED_FALLBACK_SIZE, height: EMBEDDED_FALLBACK_SIZE };
  }
}

/** Shared, per-classifier inputs {@link stackEmbeds} needs from the
 *  caller's own `EnhancedLayoutCtx` -- a narrow slice (not the whole type)
 *  so this file has no import-cycle back onto `class-body-enhanced-
 *  layout.ts`. */
export interface EmbedStackingContext {
  readonly nestedRenderer?: EmbeddedRenderer;
}

/** `MethodsOrFieldsArea.java:141-152`'s dimension loop (`y +=
 *  dim.getHeight()`) and `:429-440`'s draw order (each embed translated
 *  down by the PRIOR one's own height) -- stacked immediately below the
 *  block's own member rows, starting at `startY` (that block's post-member
 *  content top). */
export function stackEmbeds(
  sources: readonly string[][],
  ctx: EmbedStackingContext,
  startY: number,
): readonly EmbeddedBlockGeo[] {
  const renderer = ctx.nestedRenderer ?? getClassNestedDiagramRenderer();
  let y = startY;
  return sources.map((source) => {
    const geo = renderEmbed(source, renderer);
    const positioned: EmbeddedBlockGeo = { ...geo, y };
    y += geo.height;
    return positioned;
  });
}
