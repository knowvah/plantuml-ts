/**
 * Parser for PlantUML JSON diagrams (@startjson / @endjson).
 *
 * Separates #highlight directives from the JSON body, parses both,
 * and returns a JsonDiagramAST.
 */

import { parseTree, type Node as JsoncNode, type ParseError } from 'jsonc-parser';
import { JsonObject } from './JsonObject.js';
import { createSpriteRegistry } from '../../core/sprite-commands.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { ParseOptions } from '../../core/dispatcher.js';
import { internalSpriteStoreFrom } from '../../core/internal-sprite-store.js';
import { internalEmojiStoreFrom } from '../../core/internal-emoji-store.js';
import type { HighlightDirective, JsonDiagramAST } from './ast.js';
import { extractStyle, payloadOf, upstreamSourceLines } from './StyleExtractor.js';
import { headerOf } from './json-diagram-factory.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HIGHLIGHT_PREFIX = '#highlight ';

/** Matches a trailing <<stereotype>> annotation, capturing the class name. */
const RE_STEREOTYPE_SUFFIX = /\s*<<([^>]*)>>\s*$/u;

// ---------------------------------------------------------------------------
// Highlight line parsing
// ---------------------------------------------------------------------------

/**
 * Parses a single #highlight line into a HighlightDirective.
 *
 * Input (after stripping the "#highlight " prefix):
 *   `"a" / "b" / "c" <<h1>>`
 * Output:
 *   `{ path: ['a', 'b', 'c'], styleClass: 'h1' }`
 */
function parseHighlightLine(raw: string): HighlightDirective {
  // Strip prefix
  const body = raw.slice(HIGHLIGHT_PREFIX.length);

  // Capture optional trailing <<stereotype>>
  const stereotypeMatch = RE_STEREOTYPE_SUFFIX.exec(body);
  const styleClass = stereotypeMatch ? stereotypeMatch[1]!.trim().toLowerCase() : '';
  const withoutStereotype = stereotypeMatch ? body.slice(0, body.length - stereotypeMatch[0].length) : body;

  // Split on optional-space / optional-space between quoted segments:
  // handles both `"a" / "b"` and `"a"/"b"` forms.
  const segments = withoutStereotype.split(/"\s*\/\s*"/u);

  const path = segments.map((seg) => seg.trim().replace(/^"|"$/gu, ''));
  return { path, styleClass };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * D6 (cdd6-T1c): resolves `options.assetStore` into the `createSpriteRegistry`
 * pair, mirroring `class/parser.ts:326-327` -- split out (not inlined at the
 * call site, unlike class/description's precedent) purely to keep
 * `parseJson`'s own pre-existing NLOC/CCN from moving (that function is
 * ALREADY over this project's complexity-hook budget, a pre-existing
 * condition this task does not own fixing).
 */
export function jsonSpriteRegistryFor(options?: ParseOptions): ReturnType<typeof createSpriteRegistry> {
  const store = options?.assetStore;
  if (store === undefined) return createSpriteRegistry();
  return createSpriteRegistry(internalSpriteStoreFrom(store), internalEmojiStoreFrom(store));
}

/**
 * `Json.parse` of the joined payload. Upstream's `catch (ParseException)`
 * leaves `json` null, which `JsonDiagram#drawU` draws as the "does not sound
 * like JSON" page (`JsonDiagramFactory.java:93-96`, `JsonDiagram.java:116`);
 * an empty payload is such a failure too (`Json.parse("")` throws).
 */
function parseJsonBody(text: string): { root: unknown; parseError: boolean } {
  if (text.trim() === '') return { root: null, parseError: true };
  const errors: ParseError[] = [];
  const tree = parseTree(text, errors, { allowTrailingComma: true });
  return errors.length > 0 || tree === undefined
    ? { root: null, parseError: true }
    : { root: valueOf(tree), parseError: false };
}

/**
 * A parsed node as upstream's `Json.DefaultHandler` builds it: an object
 * `add`s every member in source order, a repeated name included
 * (`Json.java:377-378`, `JsonObject.java:337-348`; jar:
 * `unwind2-S2b/json-dup-key`, `json-int-keys`). Walks `parseTree` because
 * `parse` returns a plain object, which cannot hold either.
 */
function valueOf(node: JsoncNode): unknown {
  const children = node.children ?? [];
  if (node.type === 'array') return children.map(valueOf);
  if (node.type !== 'object') return node.value;
  const result = new JsonObject();
  for (const property of children) {
    const [key, value] = property.children ?? [];
    if (key !== undefined && value !== undefined) result.add(String(key.value), valueOf(value));
  }
  return result;
}

/**
 * Parses a JSON diagram source into a JsonDiagramAST, as
 * `JsonDiagramFactory#createSystem` does: a {@link extractStyle} pass takes
 * the directives (only `title`/`scale` reach the diagram -- see
 * `StyleExtractor.ts`), then of the payload a line starting with `#` is a
 * `#highlight` or is dropped, and every other line is JSON.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonDiagramFactory.java:68-111
 */
export function parseJson(source: UmlSource, options?: ParseOptions): JsonDiagramAST {
  const extractor = extractStyle(upstreamSourceLines(source, 'json'));
  const highlights: HighlightDirective[] = [];
  const body: string[] = [];
  for (const line of payloadOf(extractor)) {
    if (!line.startsWith('#')) body.push(line);
    else if (line.startsWith(HIGHLIGHT_PREFIX)) highlights.push(parseHighlightLine(line));
  }
  return {
    ...parseJsonBody(body.join('\n')),
    highlights,
    ...headerOf(extractor, true),
    sprites: jsonSpriteRegistryFor(options),
  };
}
