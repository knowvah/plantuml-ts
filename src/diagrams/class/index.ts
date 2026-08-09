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
import { rect, text } from '../../core/svg.js';
import { fmt } from '../../core/svg-format.js';

/** Error-page red, shared by the two elements that use it. */
const ERROR_COLOR = '#dc2626';

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
  const message = errors.join('; ');
  const width = 640;
  const height = 80;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(width)}" height="${fmt(height)}">` +
    rect(0, 0, width, height, { fill: '#fee2e2', stroke: ERROR_COLOR, strokeWidth: 2 }) +
    text(10, 28, 'Class diagram error:', { fill: ERROR_COLOR, fontFamily: 'monospace', fontSize: 12 }) +
    text(10, 52, message, { fill: ERROR_COLOR, fontFamily: 'monospace', fontSize: 11 }) +
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
  // block of native class constructs). See class-dispatch.ts (mission A3
  // ADR-2, as amended 2026-08-03: a block carrying an unambiguous class
  // construct is CLAIMED even when it also names descriptive elements, so
  // the allowmixing gate can refuse the leaf the way upstream does).
  accepts: classAccepts,

  parse(block) {
    return parseClass(block);
  },

  // Command errors abort the diagram upstream (`CommandExecutionResult.error`
  // -> an error page instead of a rendering), so they are carried from the AST
  // onto the geometry here and drawn by `render` below. Mirrors the chart
  // engine's identical geo-side `errors` thread (`chart/index.ts`), which
  // exists for the same reason: `SyncPlugin.render()` only receives the geo.
  //
  // SI14 T3: the same reasoning applies to `measurer` (and `sprites`, copied
  // unchanged from `ast.sprites`) -- a draw-time consumer (T4: USymbol label
  // placement) needs the measurer that produced this layout, and `render()`
  // has no other seam to get one, so it too is carried from here onto the
  // geometry rather than threaded through the `SyncPlugin` contract (ADR-1,
  // `plans/si14-usymbol-measurement-sharing/decisions.md`).
  layoutSync(ast, theme, measurer) {
    const geo = layoutClass(ast, theme, measurer);
    const errors = ast.errors ?? [];
    const spritesField = ast.sprites !== undefined ? { sprites: ast.sprites } : {};
    const errorsField = errors.length > 0 ? { errors } : {};
    return { ...geo, measurer, ...spritesField, ...errorsField };
  },

  render(geo, theme) {
    const errors = (geo as ClassGeometry & { errors?: readonly string[] }).errors;
    if (errors !== undefined && errors.length > 0) {
      return { completeSvg: renderClassErrorDiagram(errors) };
    }
    return renderClass(geo, theme);
  },
};
