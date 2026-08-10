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
import { DiagramRefusal } from '../../core/error/error-diagrams.js';

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
    const errorsField = errors.length > 0 ? { errors, errorLine: ast.errorLine } : {};
    return { ...geo, measurer, ...spritesField, ...errorsField };
  },

  render(geo, theme) {
    const { errors, errorLine } = geo as ClassGeometry & {
      errors?: readonly string[];
      errorLine?: number;
    };
    // A refused diagram THROWS rather than drawing its own error page.
    //
    // Upstream aborts the diagram when a command returns
    // `CommandExecutionResult.error(...)` and builds a `PSystemError` at the
    // TOP level, which renders the full welcome-plus-source-listing page.
    // `renderSync`/`render` already do exactly that in their own `catch` --
    // `errorSvg(source, err, options)` -- and they are the only place with the
    // source text and options that page needs, which `render(geo, theme)` has
    // no access to.
    //
    // This replaced a bespoke 640x80 red box. That box diverged from the jar
    // in shape AND in font: it drew its message with `fontFamily: 'monospace'`
    // where the jar leaves the message in the inherited `sans-serif` -- a
    // difference invisible until `SvgGraphics.java:727-728`'s monospace NBSP
    // rule was ported and started rewriting its spaces.
    if (errors !== undefined && errors.length > 0) {
      throw new DiagramRefusal(errors.join('; '), errorLine, 'class');
    }
    return renderClass(geo, theme);
  },
};
