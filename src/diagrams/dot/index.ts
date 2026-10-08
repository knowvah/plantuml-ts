import type { SyncPlugin, AssembledSvg } from '../../core/dispatcher.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { DotDiagramAST, DotGeometry } from './ast.js';
import { parseDot } from './parser.js';
import { layoutDot } from './layout.js';
import { renderDot } from './renderer.js';

/**
 * `@startdot` — a passthrough to graphviz, mirroring upstream's `directdot/`.
 *
 * Neither `theme` nor `measurer` appears below, and that is the point rather
 * than an omission: graphviz produces the finished document, so this port has
 * no drawing decisions left to make. Upstream honours no PlantUML directive
 * here: before the graphviz header a non-noise line is a syntax error, and
 * after it every line is DOT (`PSystemDotFactory.java:69-82`).
 */
export const dotPlugin: SyncPlugin<DotDiagramAST, DotGeometry> = {
  type: 'dot',

  parse(source: UmlSource): DotDiagramAST | ParseRefusal {
    return parseDot(source);
  },

  layoutSync(ast: DotDiagramAST): DotGeometry {
    return layoutDot(ast);
  },

  render(geo: DotGeometry): AssembledSvg {
    return renderDot(geo);
  },
};
