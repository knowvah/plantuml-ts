// Import for its side effect: pins @knowvah/dot-engine's text measurer to the
// canvas-free lookup table. Load-bearing HERE in a way it is not for the svek
// layout seam — this path lets the engine measure every node label itself, and
// the measured difference against the oracle is 0 diffs vs 8/5/4/36/33. See
// that module's own doc comment.
import '../../core/dot-engine-measurer.js';

import { renderSvg } from '@knowvah/dot-engine';

import type { DotDiagramAST, DotGeometry } from './ast.js';

/**
 * Run graphviz over the DOT body and keep its SVG.
 *
 * This is the whole of `@startdot` layout AND rendering — `renderSvg` does
 * both, exactly as the graphviz executable does for upstream
 * (`PSystemDot#exportDiagramNow`). `renderer.ts` only decides how to package
 * the result.
 *
 * A parse or render failure is surfaced up so the pipeline reports it, rather
 * than silently producing nothing. NOT upstream's behaviour: the jar merges
 * graphviz's stderr into its output (`ProcessRunner.java:69`,
 * `redirectErrorStream(true)`), so a DOT syntax error emits graphviz's own
 * text (`Error: <stdin>: syntax error in line 3 near '->'`) instead of an
 * SVG. Reproducing that needs graphviz's yacc error point and token, which
 * @knowvah/dot-engine's parser does not expose (and its grammar accepts some
 * inputs graphviz rejects) — library-forced; see the unwind-U2 notes.
 */
export function layoutDot(ast: DotDiagramAST): DotGeometry {
  let svg: string;
  try {
    svg = renderSvg(ast.dotContent, 'dot');
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`@startdot: could not render DOT — ${detail}`);
  }

  return { svg };
}
