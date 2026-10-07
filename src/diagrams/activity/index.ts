/**
 * Activity diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 *
 * `tests/oracle/svg-conformance/render-fixture-activity.ts` mirrors this
 * composition step for step; change both together.
 */

import type { SyncPlugin } from '../../core/dispatcher.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Warning } from '../../core/warning/Warning.js';
import type { ActivityDiagramAST } from './ast.js';
import type { ActivityGeometry } from './layout/tile-layout.js';
import { parseActivity } from './parser.js';
import { layoutActivity } from './layout/tile-layout.js';
import { renderActivity } from './renderer.js';
import { activityWarnings, withSkinParamWarnings, withWarningBanner } from './activity-warnings.js';
import { ACTIVITY_DOCUMENT_MARGIN } from './activity-layout-constants.js';

/** The plugin's geometry: the laid-out diagram plus what the export step
 *  (`DiagramChromeFactory#addWarnings`, `activity-warnings.ts`) needs --
 *  the diagram's warnings and the measurer that sizes their banner. */
export interface ActivityPluginGeometry {
  readonly geo: ActivityGeometry;
  readonly warnings: readonly Warning[];
  readonly measurer: StringMeasurer;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const activityPlugin: SyncPlugin<ActivityDiagramAST, ActivityPluginGeometry> = {
  type: 'activity',

  // D6 (cdd6-T1c): forwards `options.assetStore`, mirroring
  // `class/parser.ts:317-318` / `description/index.ts:59-67`.
  // add4-T2e: `block.styleSource.skinparam` -> `ast.warnings`
  // (`CommandSkinParam.java:92-99`, `activity-warnings.ts`).
  parse(block, options) {
    const ast = parseActivity(block, options);
    // `refused` is `ParseRefusal`'s discriminant (`dispatcher.ts#parseRefusalOf`).
    if ('refused' in ast) return ast;
    return withSkinParamWarnings(ast, block.styleSource?.skinparam);
  },

  layoutSync(ast, theme, measurer) {
    return { geo: layoutActivity(ast, theme, measurer), warnings: activityWarnings(ast), measurer };
  },

  render({ geo, warnings, measurer }, theme) {
    return withWarningBanner(renderActivity(geo, theme), warnings, measurer, ACTIVITY_DOCUMENT_MARGIN);
  },
};
