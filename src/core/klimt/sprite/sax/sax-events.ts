import { DOMParser } from '@xmldom/xmldom';

/**
 * SAX-style event adapter over `@xmldom/xmldom` (plans/sequence-divergence-
 * drive-3 decisions D2). Upstream drives `javax.xml.parsers.SAXParser` with a
 * `DefaultHandler`; the port has no JVM parser, so the document is parsed to a
 * DOM and walked in document order, emitting the same three events.
 *
 * `AttributesAdapter` (`SvgSaxParser.java:1355-1429`, the persisted copy of
 * `org.xml.sax.Attributes` used by `handleText`) is not ported: `SaxAttributes`
 * built here is already a persistent snapshot.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSaxParser.java
 */

/** `org.xml.sax.Attributes`, restricted to the calls `SvgSaxParser` makes. */
export interface SaxAttributes {
  readonly length: number;
  /** `Attributes.getQName(int)`: the prefixed name as written. */
  qName(index: number): string;
  /** `Attributes.getValue(int)`. */
  value(index: number): string;
  /** `Attributes.getValue(String)`: exact qName match. */
  get(qName: string): string | undefined;
}

/** `org.xml.sax.helpers.DefaultHandler`: every callback is optional. */
export interface SaxHandler {
  startElement?(qName: string, attrs: SaxAttributes): void;
  endElement?(qName: string): void;
  characters?(text: string): void;
}

/**
 * A malformed document. SAX is strict; upstream's `drawU` rethrows the parser
 * exception as a `RuntimeException` (`SvgSaxParser.java:112-120`).
 *
 * @see SvgSaxParser.java:112-120
 */
export class SaxParseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SaxParseError';
  }
}

/** DOM node types (DOM Level 1) used by the walk. */
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;

const DOCTYPE_MARKER = '<!DOCTYPE';
const XML_MIME_TYPE = 'application/xml';

/** Minimal structural view of an xmldom node (avoids DOM lib globals). */
interface XmlNode {
  readonly nodeType: number;
  readonly nodeName: string;
  readonly nodeValue: string;
  readonly childNodes: ArrayLike<XmlNode>;
  readonly attributes: ArrayLike<{ readonly name: string; readonly value: string }>;
}

/**
 * A namespace-aware SAX parser with the default `namespace-prefixes=false`
 * feature (`SvgSaxParser.java:161` sets only namespaceAware) does not report
 * `xmlns` / `xmlns:*` declarations as attributes.
 */
function isNamespaceDeclaration(name: string): boolean {
  return name === 'xmlns' || name.startsWith('xmlns:');
}

/**
 * Persistent attribute list in source order.
 *
 * @see SvgSaxParser.java:1355-1429 (AttributesAdapter, folded into this class)
 */
function toSaxAttributes(node: XmlNode): SaxAttributes {
  const attrs = Array.from(node.attributes).filter((a) => !isNamespaceDeclaration(a.name));
  return {
    length: attrs.length,
    qName: (index) => attrs[index]?.name ?? '',
    value: (index) => attrs[index]?.value ?? '',
    get: (qName) => attrs.find((a) => a.name === qName)?.value,
  };
}

function walk(node: XmlNode, handler: SaxHandler): void {
  if (node.nodeType === ELEMENT_NODE) {
    handler.startElement?.(node.nodeName, toSaxAttributes(node));
    for (const child of Array.from(node.childNodes)) walk(child, handler);
    handler.endElement?.(node.nodeName);
  } else if (node.nodeType === TEXT_NODE || node.nodeType === CDATA_SECTION_NODE) {
    handler.characters?.(node.nodeValue);
  }
}

/** Opening and closing delimiters of the sections that may hide a marker. */
const OPAQUE_SECTIONS: readonly (readonly [string, string])[] = [
  ['<!--', '-->'],
  ['<![CDATA[', ']]>'],
  ['<?', '?>'],
];

/**
 * Throws on a real `<!DOCTYPE` token. Comments, CDATA sections and processing
 * instructions are skipped, so the marker inside them is plain text, as for a
 * JVM SAX parser with `disallow-doctype-decl`.
 *
 * @see SvgSaxParser.java:163
 */
function refuseDoctype(xml: string): void {
  let at = xml.indexOf('<');
  while (at >= 0) {
    if (xml.startsWith(DOCTYPE_MARKER, at)) {
      throw new SaxParseError('DOCTYPE declarations are not allowed');
    }
    const section = OPAQUE_SECTIONS.find(([open]) => xml.startsWith(open, at));
    if (section === undefined) {
      at = xml.indexOf('<', at + 1);
    } else {
      const end = xml.indexOf(section[1], at + section[0].length);
      at = end < 0 ? -1 : xml.indexOf('<', end + section[1].length);
    }
  }
}

/**
 * Parses `xml` strictly and emits `startElement`/`characters`/`endElement` in
 * document order. Comments and processing instructions emit nothing. Parse
 * errors and warnings throw {@link SaxParseError}; a `<!DOCTYPE` anywhere in
 * the input is refused before the parser sees it.
 *
 * @see SvgSaxParser.java:159-175 parseSvg (DOCTYPE refused at :163)
 */
export function parseSaxEvents(xml: string, handler: SaxHandler): void {
  refuseDoctype(xml);
  const problems: string[] = [];
  const parser = new DOMParser({
    onError: (level, message) => {
      problems.push(`${level}: ${message}`);
    },
  });
  let doc: ReturnType<DOMParser['parseFromString']>;
  try {
    doc = parser.parseFromString(xml, XML_MIME_TYPE);
  } catch (err) {
    // xmldom throws its own ParseError for fatal errors.
    throw new SaxParseError(`Malformed XML (${String(err)})`, { cause: err });
  }
  const first = problems[0];
  if (first !== undefined) {
    throw new SaxParseError(`Malformed XML (${first})`);
  }
  const root = doc.documentElement as XmlNode | null;
  if (root === null) throw new SaxParseError('Malformed XML (no root element)');
  walk(root, handler);
}
