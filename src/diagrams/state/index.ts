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

  // D6 (cdd6-T1c): forwards `options.assetStore` to `parseState`, mirroring
  // `class/parser.ts:317-318` / `description/index.ts:59-67` — see
  // `.agent-notes/cdd5-T3-assetstore-gap.md` for the gap this closes.
  parse(block, options) {
    return parseState(block, options);
  },

  layoutSync(ast, theme, measurer) {
    return layoutState(ast, theme, measurer);
  },

  render(geo, theme) {
    return renderState(geo, theme);
  },
};
