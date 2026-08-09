// Import for its side effect: pins @knowvah/dot-engine's text measurer to the
// canvas-free lookup table. Load-bearing HERE in a way it is not for the svek
// layout seam — this path lets the engine measure every node label itself, and
// the measured difference against the oracle is 0 diffs vs 8/5/4/36/33. See
// that module's own doc comment.
import '../../core/dot-engine-measurer.js';

import { renderSvg } from '@knowvah/dot-engine';

import type { DotDiagramAST, DotGeometry } from './ast.js';

/** graphviz writes `viewBox="0.00 0.00 94.00 329.00"` on the root element. */
const VIEWBOX_RE = /\bviewBox\s*=\s*"\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/;

/**
 * An empty DOT body is not an error. A block holding only a `title` reaches
 * here with nothing to lay out; upstream's factory would not have produced a
 * diagram at all, and this port renders the chrome alone.
 */
const EMPTY_SVG_GEOMETRY = { svg: '', width: 0, height: 0 } as const;

function readViewBox(svg: string): { width: number; height: number } {
  const m = VIEWBOX_RE.exec(svg);
  // Unreachable for engine output — its SVG writer always emits a root
  // viewBox — but the fallback keeps a malformed document from producing NaN
  // dimensions downstream.
  /* v8 ignore next */
  if (m === null) return { width: 0, height: 0 };
  return { width: Number(m[1]), height: Number(m[2]) };
}

/**
 * Run graphviz over the DOT body and keep its SVG.
 *
 * This is the whole of `@startdot` layout AND rendering — `renderSvg` does
 * both, exactly as the graphviz executable does for upstream
 * (`PSystemDot#exportDiagramNow`). `renderer.ts` only decides how to package
 * the result.
 *
 * A parse or render failure is surfaced up so the pipeline reports it, rather
 * than silently producing nothing. Upstream's analogue is its "GraphViz has
 * crashed" / "issue with your Dot/Graphviz installation" error blocks.
 */
export function layoutDot(ast: DotDiagramAST): DotGeometry {
  if (ast.dotContent.trim() === '') {
    return { ...EMPTY_SVG_GEOMETRY, annotations: ast.annotations };
  }

  let svg: string;
  try {
    svg = renderSvg(ast.dotContent, 'dot');
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`@startdot: could not render DOT — ${detail}`);
  }

  return { svg, ...readViewBox(svg), annotations: ast.annotations };
}
