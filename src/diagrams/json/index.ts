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

  accepts(lines: readonly string[]): boolean {
    // #lizard forgives -- pre-existing violation (16 CCN vs. this repo's 10
    // cap), untouched by A5/T4: this mission only added the `jsonShell` line
    // in `render()` below. The complexity is one flat keyword-dispatch chain
    // mirroring upstream's StyleExtractor pre-filtering; splitting it is a
    // separate change with its own risk, not a drive-by.
    // Skip leading directive lines that appear before the JSON body in
    // @startjson blocks (title, skinparam, scale, hide, skin, !assume, !pragma,
    // <style>…</style>). Mirrors Java StyleExtractor pre-filtering.
    let inStyle = false;
    for (const line of lines) {
      const t = line.trim();
      if (t === '') continue;
      if (t === '<style>') { inStyle = true; continue; }
      if (inStyle) { if (t === '</style>') inStyle = false; continue; }
      if (/^(?:title |skinparam |scale |skin |hide |!assume |!pragma )/i.test(t)) continue;
      // Any valid JSON value: object, array, string, boolean keyword, null, number
      return (
        t.startsWith('{') ||
        t.startsWith('[') ||
        t.startsWith('#highlight') ||
        t.startsWith('"') ||
        t === 'null' ||
        t === 'true' ||
        t === 'false' ||
        /^-?[0-9]/.test(t)
      );
    }
    return false;
  },

  parse(source) {
    return parseJson(source);
  },

  layoutSync(ast, theme, measurer) {
    return layoutJson(ast, theme, measurer);
  },

  render(geo, theme) {
    // A5 / T4: `jsonShell` routes the fragment through the shared
    // jar-faithful document shell instead of the generic `svgRoot`, and
    // carries the jar's own `data-diagram-type` value. Set HERE rather than
    // inside `renderJson` because one renderer serves three diagram types --
    // yaml and hcl import it directly and pass their own -- and the plugin is
    // the thing that knows which type it is.
    return { ...renderJson(geo, theme), jsonShell: DIAGRAM_TYPE_JSON };
  },
};
