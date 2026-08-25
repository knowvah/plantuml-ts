/**
 * State diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 */

import type { SyncPlugin } from '../../core/dispatcher.js';
import type { StateDiagramAST } from './ast.js';
import type { StateGeometry } from './layout.js';
import { parseState } from './parser.js';
import { layoutState } from './layout.js';
import { renderState } from './renderer.js';

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const statePlugin: SyncPlugin<StateDiagramAST, StateGeometry> = {
  type: 'state',

  parse(block) {
    return parseState(block);
  },

  layoutSync(ast, theme, measurer) {
    return layoutState(ast, theme, measurer);
  },

  render(geo, theme) {
    return renderState(geo, theme);
  },
};
