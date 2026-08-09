import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';

/**
 * `@startdot` is a PASSTHROUGH, not a diagram model.
 *
 * @see .../directdot/PSystemDot.java#exportDiagramNow — upstream hands the
 * accumulated DOT text to the graphviz executable and writes graphviz's own
 * bytes straight to the output stream. There is no PlantUML drawing model in
 * between: no `TextBlock`, no klimt shapes, no skin. What the jar emits for
 * `@startdot` is literally graphviz's SVG writer's output, `pt` units,
 * `Times,serif`, negative y coordinates, `graph0`/`clust1`/`node1`/`edge1` ids
 * and all.
 *
 * So this AST holds the DOT SOURCE, not a parsed graph. An earlier
 * implementation projected @knowvah/dot-engine's `parse()` result into a
 * node/edge/cluster model and re-drew it with this port's own SVG emitters;
 * that produced PlantUML-shaped markup which cannot match the oracle by
 * construction (root `childCount` alone diverged, so the conformance
 * comparator could not even descend into the body). The projection is gone.
 */
export interface DotDiagramAST {
  /**
   * The DOT body: source with the PlantUML-only lines removed
   * (`@startdot`/`@enddot`, comments, `skinparam`, the chrome commands, and
   * `sprite` blocks). Handed to the engine verbatim.
   */
  dotContent: string;
  /**
   * Retained for the AST's shape only — `skinparam` cannot reach graphviz's
   * output. Upstream drops these too (its factory ignores every line before
   * the `digraph {` header and passes every line after it to graphviz as DOT).
   */
  skinparamLines: readonly string[];
  /** Raw `<style>` block strings. Inert here, for the same reason. */
  rawStyles: readonly string[];
  /**
   * title/caption/legend/header/footer/mainframe chrome (mission G0b/T8).
   *
   * DELIBERATE DIVERGENCE — see DIVERGENCES.md. The jar REJECTS these inside
   * `@startdot`: `title My Graph` on line 2 yields "Syntax Error? (Assumed
   * diagram type: dot)", because `PSystemDotFactory#executeLine` only starts
   * accumulating once a line matches its graphviz-header pattern. This port
   * renders them instead. That costs zero conformance precisely because the
   * inputs it applies to have no oracle to conform to, and it keeps G0b's
   * cross-engine chrome unification intact.
   */
  annotations: DiagramAnnotations;
  /** `sprite $name { … }` definitions (SI5b/T4). Same divergence rationale. */
  sprites: SpriteRegistry;
}

/**
 * What the engine hands back: graphviz's finished SVG document plus the
 * dimensions read off its root element. No geometry model — see the note on
 * `DotDiagramAST`.
 */
export interface DotGeometry {
  /** graphviz's complete SVG document, exactly as the engine emitted it. */
  svg: string;
  /** Root `viewBox` width, in the `pt` units graphviz writes. */
  width: number;
  /** Root `viewBox` height, same units. */
  height: number;
  annotations: DiagramAnnotations;
}
