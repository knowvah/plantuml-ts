import type { SyncPlugin, AssembledSvg } from '../../core/dispatcher.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { DotDiagramAST, DotGeometry } from './ast.js';
import { parseDot } from './parser.js';
import { layoutDot } from './layout.js';
import { renderDot } from './renderer.js';

/**
 * `@startdot` — a passthrough to graphviz, mirroring upstream's `directdot/`.
 *
 * Neither `theme` nor `measurer` appears below, and that is the point rather
 * than an omission: graphviz produces the finished document, so this port has
 * no drawing decisions left to make. `skinparam` and `<style>` are parsed and
 * then ignored for the same reason — an earlier implementation mapped them
 * onto a `Theme` that coloured this port's OWN re-drawing of the graph, and
 * that re-drawing is what the passthrough replaced. Upstream honours neither
 * (its factory feeds every post-header line to graphviz as DOT).
 */
export const dotPlugin: SyncPlugin<DotDiagramAST, DotGeometry> = {
  type: 'dot',

  accepts(_lines: readonly string[]): boolean {
    return false;
  },

  parse(source: UmlSource): DotDiagramAST {
    // parseDot expects a raw string; join the extracted lines back together so
    // the @startdot / @enddot markers and chrome directives are visible.
    return { ...parseDot(source.lines.join('\n')), rawStyles: source.rawStyles ?? [] };
  },

  layoutSync(ast: DotDiagramAST): DotGeometry {
    return layoutDot(ast);
  },

  render(geo: DotGeometry): AssembledSvg {
    return renderDot(geo);
  },
};
