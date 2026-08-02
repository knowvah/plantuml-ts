/**
 * Class diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 */

import type { SyncPlugin } from '../../core/dispatcher.js';
import type { ClassDiagramAST } from './ast.js';
import type { ClassGeometry } from './layout.js';
import { classAccepts } from './class-dispatch.js';
import { parseClass } from './parser.js';
import { layoutClass } from './layout.js';
import { renderClass } from './renderer.js';

// ---------------------------------------------------------------------------
// Error rendering
// ---------------------------------------------------------------------------

/**
 * Upstream aborts a diagram whose command returned
 * `CommandExecutionResult.error(...)` and draws an error page carrying the
 * message. This is that page's minimal equivalent — deliberately NOT a
 * reproduction of the jar's welcome-plus-source layout, which is a much
 * larger surface; the load-bearing part is that the diagram is REFUSED and
 * the reason is stated, rather than an element the jar rejects being drawn
 * silently.
 *
 * Shape mirrors `chart/renderer.ts#renderErrorDiagram`, the existing
 * precedent for a plugin returning a `completeSvg` error document.
 */
function renderClassErrorDiagram(errors: readonly string[]): string {
  const escaped = errors
    .join('; ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const width = 640;
  const height = 80;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect width="${width}" height="${height}" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>` +
    `<text x="10" y="28" fill="#dc2626" font-family="monospace" font-size="12">Class diagram error:</text>` +
    `<text x="10" y="52" fill="#dc2626" font-family="monospace" font-size="11">${escaped}</text>` +
    `</svg>`
  );
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const classPlugin: SyncPlugin<ClassDiagramAST, ClassGeometry> = {
  type: 'class',

  // Class-vs-description routing mirrors upstream's factory-selection outcome
  // (ClassDiagramFactory is tried before DescriptionDiagramFactory; the class
  // factory owns mixed class+descriptive blocks under `allowmixing` and any
  // block of native class constructs). See class-dispatch.ts (mission A3 ADR-2).
  accepts: classAccepts,

  parse(block) {
    return parseClass(block);
  },

  // Command errors abort the diagram upstream (`CommandExecutionResult.error`
  // -> an error page instead of a rendering), so they are carried from the AST
  // onto the geometry here and drawn by `render` below. Mirrors the chart
  // engine's identical geo-side `errors` thread (`chart/index.ts`), which
  // exists for the same reason: `SyncPlugin.render()` only receives the geo.
  layoutSync(ast, theme, measurer) {
    const geo = layoutClass(ast, theme, measurer);
    const errors = ast.errors ?? [];
    return errors.length > 0 ? { ...geo, errors } : geo;
  },

  render(geo, theme) {
    const errors = (geo as ClassGeometry & { errors?: readonly string[] }).errors;
    if (errors !== undefined && errors.length > 0) {
      return { completeSvg: renderClassErrorDiagram(errors) };
    }
    return renderClass(geo, theme);
  },
};
