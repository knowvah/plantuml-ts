/**
 * Activity diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 */

import type { SyncPlugin } from '../../core/dispatcher.js';
import type { ActivityDiagramAST } from './ast.js';
import type { ActivityGeometry } from './layout/tile-layout.js';
import { parseActivity } from './parser.js';
import { layoutActivity } from './layout/tile-layout.js';
import { renderActivity } from './renderer.js';

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const activityPlugin: SyncPlugin<ActivityDiagramAST, ActivityGeometry> = {
  type: 'activity',

  // D6 (cdd6-T1c): forwards `options.assetStore`, mirroring
  // `class/parser.ts:317-318` / `description/index.ts:59-67`.
  parse(block, options) {
    return parseActivity(block, options);
  },

  layoutSync(ast, theme, measurer) {
    return layoutActivity(ast, theme, measurer);
  },

  render(geo, theme) {
    return renderActivity(geo, theme);
  },
};
