/**
 * HCL diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 *
 * HCL diagrams are only routed via @starthcl / @endhcl blocks extracted
 * by the block-extractor (START_SUFFIX_MAP['hcl'] === 'hcl'). The accepts()
 * method always returns false — HCL content is never auto-detected inside
 * @startuml blocks. (D4)
 */

import type { SyncPlugin } from '../../core/dispatcher.js';
import type { JsonDiagramAST } from '../json/ast.js';
import type { JsonGeometry } from '../json/layout.js';
import { parseHcl } from './parser.js';
import { layoutJson } from '../json/layout.js';
import { renderJson } from '../json/renderer.js';

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/** The jar's `data-diagram-type` value for this engine. Mirrors each sibling
 *  engine's own local constant (`DIAGRAM_TYPE_CLASS`, `DIAGRAM_TYPE_STATE`). */
const DIAGRAM_TYPE_HCL = 'HCL';

export const hclPlugin: SyncPlugin<JsonDiagramAST, JsonGeometry> = {
  type: 'hcl',

  accepts(_lines: readonly string[]): boolean {
    return false;
  },

  parse(source) {
    return parseHcl(source);
  },

  layoutSync(ast, theme, measurer) {
    return layoutJson(ast, theme, measurer);
  },

  render(geo, theme) {
    // A5 / T4. hcl has no renderer of its own — `renderJson` above is json's.
    // The jar still tags the document `data-diagram-type="HCL"`.
    return { ...renderJson(geo, theme), jsonShell: DIAGRAM_TYPE_HCL };
  },
};
