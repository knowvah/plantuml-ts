/**
 * `@startdot` is a PASSTHROUGH, not a diagram model.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/directdot/PSystemDot.java:63-66
 * — the whole of upstream's state is one `String data`, the accumulated DOT
 * text. `exportDiagramNow` (java:78-115) hands it to the graphviz executable
 * and writes graphviz's own bytes straight to the output stream. There is no
 * PlantUML drawing model in between: no `TextBlock`, no klimt shapes, no skin,
 * and no chrome — `PSystemDot extends DirectOsDiagram`, which never reaches
 * `DiagramChromeFactory`. What the jar emits for `@startdot` is literally
 * graphviz's SVG writer's output, `pt` units, `Times,serif`, negative y
 * coordinates, `graph0`/`clust1`/`node1`/`edge1` ids and all.
 *
 * So this AST holds the DOT SOURCE, not a parsed graph. An earlier
 * implementation projected @knowvah/dot-engine's `parse()` result into a
 * node/edge/cluster model and re-drew it with this port's own SVG emitters;
 * that produced PlantUML-shaped markup which cannot match the oracle by
 * construction. The projection is gone, and so is the later port-only chrome
 * path (title/caption/legend/header/footer, sprites, skinparam lifting): the
 * jar has none of it — see `parser.ts`.
 */
export interface DotDiagramAST {
  /**
   * upstream's `PSystemDot#data`: the graphviz-header line and every line
   * after it up to `@enddot`, each followed by `\n`, byte-for-byte.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/directdot/PSystemDotFactory.java:71-81
   */
  dotContent: string;
}

/**
 * What the engine hands back: graphviz's finished SVG document. No geometry
 * model — see the note on `DotDiagramAST`.
 */
export interface DotGeometry {
  /** graphviz's complete SVG document, exactly as the engine emitted it. */
  svg: string;
}
