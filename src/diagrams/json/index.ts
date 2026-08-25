/**
 * JSON diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 *
 * Accepts sources that begin with a JSON literal ({, [) or a #highlight
 * directive, matching @startjson / @endjson blocks extracted by the
 * block-extractor.
 */

import type { SyncPlugin } from '../../core/dispatcher.js';
import type { JsonDiagramAST } from './ast.js';
import type { JsonGeometry } from './layout.js';
import { parseJson } from './parser.js';
import { layoutJson } from './layout.js';
import { renderJson } from './renderer.js';

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/** The jar's `data-diagram-type` value for this engine. Mirrors each sibling
 *  engine's own local constant (`DIAGRAM_TYPE_CLASS`, `DIAGRAM_TYPE_STATE`,
 *  `DIAGRAM_TYPE_DESCRIPTION`). */
const DIAGRAM_TYPE_JSON = 'JSON';

export const jsonPlugin: SyncPlugin<JsonDiagramAST, JsonGeometry> = {
  type: 'json',

  parse(source) {
    return parseJson(source);
  },

  layoutSync(ast, theme, measurer) {
    return layoutJson(ast, theme, measurer);
  },

  render(geo, theme) {
    // A5 / T4, T8: `diagramType` routes the fragment through the shared
    // jar-faithful document shell (`core/assemble-svg.ts`) instead of the
    // generic `svgRoot`, and carries the jar's own `data-diagram-type`
    // value. Set HERE rather than inside `renderJson` because one renderer
    // serves three diagram types -- yaml and hcl import it directly and
    // pass their own -- and the plugin is the thing that knows which type
    // it is.
    return { ...renderJson(geo, theme), diagramType: DIAGRAM_TYPE_JSON };
  },
};
