import type { AssembledSvg } from '../../core/dispatcher.js';

import type { DotGeometry } from './ast.js';

/**
 * Package graphviz's SVG for the pipeline: the engine's document as a
 * `CompleteSvg`, byte-for-byte. `src/index.ts` passes a non-`description`
 * `CompleteSvg` straight through, so nothing downstream re-wraps or
 * re-formats it — upstream writes graphviz's bytes verbatim too, with no
 * PlantUML chrome around them (`PSystemDot extends DirectOsDiagram`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/directdot/PSystemDot.java:78-115
 */
export function renderDot(geo: DotGeometry): AssembledSvg {
  return { completeSvg: geo.svg };
}
