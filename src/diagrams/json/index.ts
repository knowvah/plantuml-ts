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

/**
 * True when a line already known to start with `{` opens a JSON object --
 * `{`, `{}`, or `{"key"...`. Distinguishes a JSON object literal from a
 * sequence diagram's teoz timing-anchor label, `{start}` / `{end}`
 * (`~/git/plantuml/.../sequencediagram/teoz/...` anchor syntax), which is
 * `{` followed immediately by a bare, unquoted identifier and closing brace
 * -- never a valid JSON value start.
 */
function looksLikeJsonObjectOpen(t: string): boolean {
  const rest = t.slice(1).trimStart();
  return rest === '' || rest.startsWith('}') || rest.startsWith('"');
}

/**
 * True when a line already known to start with `[` opens a JSON array --
 * `[`, `[]`, or `[1, 2, ...]`. Distinguishes a JSON array literal from a
 * sequence diagram's "message from/to an actor outside the diagram" arrow
 * syntax (`[->`, `[<-`; `~/git/plantuml/.../sequencediagram/command/
 * CommandLinear.java`'s bracket-actor grammar), which is `[` followed
 * immediately by an arrow -- never a valid JSON value start.
 */
function looksLikeJsonArrayOpen(t: string): boolean {
  const rest = t.slice(1).trimStart();
  return (
    rest === '' ||
    rest.startsWith(']') ||
    rest.startsWith('{') ||
    rest.startsWith('[') ||
    rest.startsWith('"') ||
    rest.startsWith('true') ||
    rest.startsWith('false') ||
    rest.startsWith('null') ||
    /^-?[0-9]/.test(rest)
  );
}

export const jsonPlugin: SyncPlugin<JsonDiagramAST, JsonGeometry> = {
  type: 'json',

  accepts(lines: readonly string[]): boolean {
    // #lizard forgives -- pre-existing violation (16 CCN vs. this repo's 10
    // cap), untouched by A5/T4/T8: those missions only touched the
    // `diagramType` line in `render()` below. The complexity is one flat keyword-dispatch chain
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
      // `title` accepts both the space form ("title Foo") and the colon form
      // ("title: Foo" / "title:Foo") -- CommandTitle.java:63's grammar,
      // `title(?:[%s]*:[%s]*|[%s]+)`, matched case-insensitively
      // (Pattern2.java:114). Only the space form was recognised before; the
      // colon form fell through and was misread as diagram content one line
      // too early.
      if (/^(?:title(?:\s*:|\s)|skinparam |scale |skin |hide |!assume |!pragma )/i.test(t)) continue;
      // Any valid JSON value: object, array, string, boolean keyword, null, number
      if (t.startsWith('{')) return looksLikeJsonObjectOpen(t);
      if (t.startsWith('[')) return looksLikeJsonArrayOpen(t);
      return (
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
