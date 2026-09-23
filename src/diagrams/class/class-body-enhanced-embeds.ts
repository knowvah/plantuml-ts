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
 * same convention as `ClassifierGeo['rows'][number].y`. `width`/`height` are
 * the DRAWN `<image>` element's own dimensions (the real nested render,
 * jar-verified byte-exact -- `.agent-notes/cdd-T27.md`); `href` is absent
 * only on the `EmbeddedDiagram.java:148-152` fixed-size fallback (no
 * renderer registered, or the renderer threw) -- the space is reserved but
 * nothing is drawn, matching that method's own `drawU` catch (java:191-193)
 * failing independently and drawing nothing.
 *
 * `sizingWidth`/`sizingHeight` are a SEPARATE pair: the enclosing box's
 * geometry contribution and the NEXT embed's own Y-stacking offset both come
 * from `EmbeddedDiagram#calculateDimension` (`TextBlockMemoized`-cached),
 * NOT from the drawn image's own size -- see this file's `EMBEDDED_FALLBACK_
 * SIZE` doc comment for why, in this port's deterministic oracle-render
 * environment, that memoized value is ALWAYS the `(42, 42)` catch fallback,
 * confirmed byte-exact across three independent fixtures.
 */
export interface EmbeddedBlockGeo {
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly href?: string;
  readonly sizingWidth: number;
  readonly sizingHeight: number;
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
 *  case (as the DRAWN size, since a failed render has no image to draw) AND,
 *  unconditionally, as every embed's SIZING contribution -- see {@link
 *  EmbeddedBlockGeo}'s own doc comment and "The sizing/drawing asymmetry"
 *  below. A recursion-guard trip ({@link EmbeddedDiagramDepthError}) is
 *  RE-THROWN, never swallowed into this fallback -- task item 3's own
 *  contract ("throws ... rather than recursing") means a self-embedding
 *  block is malformed input the caller must fix, not a transient render
 *  failure to hide. */
const EMBEDDED_FALLBACK_SIZE = 42;

/**
 * The sizing/drawing asymmetry (CDD B7FU-R2, `.agent-notes/cdd-B7FU-R2.md`):
 * `EmbeddedDiagram#calculateDimensionSlow` (`EmbeddedDiagram.java:126-148`)
 * and `#drawU` (`java:161-196`) each independently branch on `ug.matchesProperty
 * ("SVG")` -- `calculateDimensionSlow` runs during the classifier's LAYOUT
 * pass, whose `StringBounder` is a generic, AWT/`PortableImage`-oriented
 * measurer (`getImage` -> `SImageIO.read`, java:237-245) that does NOT carry
 * the final export format; `drawU` runs during the SEPARATE draw pass with
 * the real SVG-target `UGraphic`, whose `matchesProperty("SVG")` IS true, so
 * it takes the `getImageSvg` branch (java:169-176) and succeeds. In this
 * port's deterministic oracle-render environment the AWT path always throws
 * (headless -- no `PortableImage` producer), so `calculateDimensionSlow`
 * ALWAYS falls to its `catch` -> `(42, 42)` (java:148-152), while `drawU`
 * ALWAYS succeeds and draws the real nested SVG. Confirmed byte-exact, not
 * fitted, across three independent fixtures (moxobo-16-tipo829 43x54,
 * zikabo-17-gugi332 67x64, gadufu-56-votu808 133x107 -- every one's box
 * width/height matches EXACTLY when the embed's SIZING contribution is
 * hardcoded to (42, 42) regardless of its real, successfully-drawn size).
 * `MethodsOrFieldsArea#drawU`'s own Y-translate between successive embeds
 * (`java:436`) reads `embedded.calculateDimension(stringBounder).getHeight()`
 * -- the SAME `TextBlockMemoized`-cached call `calculateDimensionSlow`
 * populated, i.e. the FALLBACK height, not the real one -- so {@link
 * stackEmbeds}'s own Y-stacking below mirrors that, not `width`/`height`.
 * Per CLAUDE.md ("preserve... behavior that looks like a bug... never fix
 * an apparent upstream bug inline"): this is upstream's own real,
 * deterministic (in this environment) behavior, reproduced faithfully, not
 * papered over -- distinct from gadufu-56-votu808's SEPARATE, out-of-scope
 * residual named in `.agent-notes/cdd-B7FU-R2.md` (the drawn image's own
 * Δ12/Δ11 width/height, an ACTIVITY-engine Cyrillic-text measurement gap,
 * not this mechanism).
 */
function renderEmbed(source: readonly string[], renderer: EmbeddedRenderer | undefined): Omit<EmbeddedBlockGeo, 'y' | 'sizingWidth' | 'sizingHeight'> {
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
 *  down by the PRIOR one's own `calculateDimension(...).getHeight()`, the
 *  SAME memoized/fallback value the sizing pass used -- NOT the real drawn
 *  height, see {@link renderEmbed}'s "sizing/drawing asymmetry" doc comment)
 *  -- stacked immediately below the block's own member rows, starting at
 *  `startY` (that block's post-member content top). */
export function stackEmbeds(
  sources: readonly string[][],
  ctx: EmbedStackingContext,
  startY: number,
): readonly EmbeddedBlockGeo[] {
  const renderer = ctx.nestedRenderer ?? getClassNestedDiagramRenderer();
  let y = startY;
  return sources.map((source) => {
    const geo = renderEmbed(source, renderer);
    const positioned: EmbeddedBlockGeo = {
      ...geo,
      y,
      sizingWidth: EMBEDDED_FALLBACK_SIZE,
      sizingHeight: EMBEDDED_FALLBACK_SIZE,
    };
    y += EMBEDDED_FALLBACK_SIZE;
    return positioned;
  });
}
