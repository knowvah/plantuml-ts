import type { HighlightDirective, JsonDiagramAST } from '../json/ast.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { ParseOptions } from '../../core/dispatcher.js';
// D6 (cdd6-T1c): shared with json/hcl -- see that function's own doc comment
// for why this is imported rather than re-inlined (json/yaml/hcl already
// share `layoutJson`/`renderJson`, `yaml/index.ts`; this is the same trio).
import { jsonSpriteRegistryFor } from '../json/parser.js';
import { parseYamlLines } from './yaml-parser.js';
import { monomorphToJson } from './monomorph.js';
import { extractStyle, payloadOf, upstreamSourceLines } from '../json/StyleExtractor.js';
import { headerOf } from '../json/json-diagram-factory.js';

/** `Highlighted.HIGHLIGHTED` (`yaml/Highlighted.java:49`). */
const HIGHLIGHT_PREFIX = '#highlight ';

/**
 * Parse a single `#highlight` directive line into a HighlightDirective.
 *
 * Port of Highlighted.build() / Highlighted.toList() from
 * net.sourceforge.plantuml.yaml.Highlighted.
 *
 * Algorithm:
 *   1. Strip `#highlight ` prefix
 *   2. Capture and strip optional trailing `<<stereotype>>` via regex
 *   3. Split by `/`, trim each segment, strip surrounding double-quotes
 */
function parseYamlHighlightLine(line: string): HighlightDirective {
  // Strip "#highlight " prefix (11 chars)
  let rest = line.slice(HIGHLIGHT_PREFIX.length).trim();

  // Capture optional trailing <<stereotype>>
  const stereotypeMatch = /\s*<<([^<>]*)>>\s*$/.exec(rest);
  const styleClass = stereotypeMatch ? stereotypeMatch[1]!.trim().toLowerCase() : '';
  rest = stereotypeMatch ? rest.slice(0, rest.length - stereotypeMatch[0].length).trim() : rest;

  // Split on "/" and clean each segment
  const path = rest.split('/').map((segment) => {
    const s = segment.trim();
    // Strip surrounding double-quotes if present
    if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
      return s.slice(1, -1);
    }
    return s;
  });

  return { path, styleClass };
}

/**
 * `MonomorphToJson.convert(new YamlParser().parse(list))`. Any exception
 * leaves the value null (`YamlDiagramFactory.java:90-93`), and so does a
 * monomorph that is no scalar/list/map (`MonomorphToJson.java:44-52`, an
 * empty payload): `JsonDiagram#drawU` draws both as the "does not sound like
 * YAML data" page (`JsonDiagram.java:116-122`). A bare scalar document is
 * one -- `YamlParser.java:53-54` throws on `NO_KEY_ONLY_TEXT` -- so unlike
 * json a yaml diagram never reaches the scalar-root wrap
 * (jar: `tests/fixtures/unwind-U1/yaml-root-*`).
 */
function parseYamlBody(list: string[], parseWarnings: string[]): { root: unknown; parseError: boolean } {
  try {
    const root = monomorphToJson(parseYamlLines(list, parseWarnings));
    return { root, parseError: root === null };
  } catch {
    return { root: null, parseError: true };
  }
}

/**
 * Parses a YAML diagram source, as `YamlDiagramFactory#createSystem` does: a
 * {@link extractStyle} pass takes the directives (only `title`/`scale` reach
 * the diagram -- see `StyleExtractor.ts`), then of the payload a
 * `#highlight ` line is a highlight and every other line is YAML.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/yaml/YamlDiagramFactory.java:67-108
 */
export function parseYaml(source: UmlSource, options?: ParseOptions): JsonDiagramAST {
  const extractor = extractStyle(upstreamSourceLines(source, 'yaml'));
  const highlights: HighlightDirective[] = [];
  const list: string[] = [];
  for (const line of payloadOf(extractor)) {
    if (line.startsWith(HIGHLIGHT_PREFIX)) highlights.push(parseYamlHighlightLine(line));
    else list.push(line);
  }
  const parseWarnings: string[] = [];
  return {
    ...parseYamlBody(list, parseWarnings),
    diagramLabel: 'YAML' as const,
    highlights,
    ...headerOf(extractor, true),
    // D6 (cdd6-T1c): mirrors `class/parser.ts:326-327`.
    sprites: jsonSpriteRegistryFor(options),
    ...(parseWarnings.length === 0 ? {} : { parseWarnings }),
  };
}
