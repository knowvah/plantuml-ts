/**
 * YAML diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 *
 * Accepts sources that begin with a YAML key-value, list item, or
 * #highlight directive — i.e., content that is NOT a JSON literal.
 * Matches @startyaml / @endyaml blocks extracted by the block-extractor.
 *
 * NOTE: For @startyaml blocks, the dispatcher routes by type directly
 * (never calls accepts()). The accepts() logic here handles the rare case
 * where YAML appears inside @startuml. It must be conservative enough not
 * to steal sequence/class content (which also starts with word chars).
 * YAML-specific markers: key-value pairs contain ": ", list items start
 * with "- ", and #highlight is the only directive prefix used by YAML.
 */

import type { SyncPlugin } from '../../core/dispatcher.js';
import type { JsonDiagramAST } from '../json/ast.js';
import type { JsonGeometry } from '../json/layout.js';
import { parseYaml } from './parser.js';
import { layoutJson } from '../json/layout.js';
import { renderJson } from '../json/renderer.js';

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/** The jar's `data-diagram-type` value for this engine. Mirrors each sibling
 *  engine's own local constant (`DIAGRAM_TYPE_CLASS`, `DIAGRAM_TYPE_STATE`). */
const DIAGRAM_TYPE_YAML = 'YAML';

export const yamlPlugin: SyncPlugin<JsonDiagramAST, JsonGeometry> = {
  type: 'yaml',


  parse(source) {
    return parseYaml(source);
  },

  layoutSync(ast, theme, measurer) {
    return layoutJson(ast, theme, measurer);
  },

  render(geo, theme) {
    // A5 / T4, T8. yaml has no renderer of its own — `renderJson` above is
    // json's. The jar still tags the document `data-diagram-type="YAML"`,
    // so the type is supplied here, by the plugin that knows it, rather
    // than baked into the shared renderer.
    return { ...renderJson(geo, theme), diagramType: DIAGRAM_TYPE_YAML };
  },
};
