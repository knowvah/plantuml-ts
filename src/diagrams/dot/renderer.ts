import { isEmpty } from '../../core/annotations/index.js';
import type { AssembledSvg, RenderFragment } from '../../core/dispatcher.js';

import type { DotGeometry } from './ast.js';

/**
 * Everything between the root `<svg …>` open tag and its `</svg>` close.
 * Deliberately not a parse: the target is one known producer (the engine's own
 * SVG writer), whose root element is the last `<svg` in the prolog and whose
 * document ends with `</svg>`.
 */
const ROOT_OPEN_RE = /<svg\b[^>]*>/;

function innerMarkup(svg: string): string {
  const open = ROOT_OPEN_RE.exec(svg);
  /* v8 ignore next */
  if (open === null) return svg;
  const start = open.index + open[0].length;
  const end = svg.lastIndexOf('</svg>');
  /* v8 ignore next */
  if (end < start) return svg.slice(start);
  return svg.slice(start, end);
}

/**
 * Package graphviz's SVG for the pipeline.
 *
 * Two paths, and which one runs is decided entirely by whether the block
 * carried PlantUML chrome:
 *
 *  - **No chrome — the conformance path, and 100% of both corpora.** Return
 *    the engine's document as a `CompleteSvg`, byte-for-byte. `src/index.ts`
 *    passes a non-`description` `CompleteSvg` straight through, so nothing
 *    downstream re-wraps or re-formats it. This is what makes the type
 *    conformant: upstream writes graphviz's bytes verbatim
 *    (`PSystemDot#exportDiagramNow`), and so do we.
 *
 *  - **Chrome present — the divergence path.** Hand back a `RenderFragment`
 *    whose body is graphviz's own inner markup (its `<g id="graph0">` and the
 *    `translate(…)` that flips graphviz's negative y coordinates comes along
 *    inside it, so no coordinate rewriting is needed), letting the SHARED
 *    `applyChrome` compose title/caption/legend around it exactly as for every
 *    other engine. Reachable only on inputs the jar rejects outright — see the
 *    divergence note on `DotDiagramAST.annotations` — so it trades no
 *    conformance for the capability.
 */
export function renderDot(geo: DotGeometry): AssembledSvg {
  if (isEmpty(geo.annotations)) return { completeSvg: geo.svg };

  const fragment: RenderFragment = {
    body: innerMarkup(geo.svg),
    width: geo.width,
    height: geo.height,
  };
  return fragment;
}
