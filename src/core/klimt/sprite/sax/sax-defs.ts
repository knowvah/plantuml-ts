import type { SaxAttributes, SaxHandler } from './sax-events.js';

/**
 * Pass 1 of `SvgSaxParser`: collects `<defs>` / `<symbol>` / gradient
 * definitions by id (plans/sequence-divergence-drive-3 decisions D2).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSaxParser.java:186-343
 */

/**
 * Gradient stop color information.
 *
 * @see SvgSaxParser.java:321-343 (GradientStop)
 */
export class GradientStop {
  constructor(
    readonly offset: string,
    readonly color: string,
    readonly opacity: string | undefined,
  ) {}
}

/**
 * Buffered SVG element for definitions.
 *
 * @see SvgSaxParser.java:304-320 (BufferedElement)
 */
export class BufferedElement {
  readonly stops: GradientStop[] = [];

  constructor(
    readonly tagName: string,
    readonly xmlContent: string,
    readonly attributes: Map<string, string>,
  ) {}
}

/** Tags whose start switches `inDefs` on (`SvgSaxParser.java:203-207`). */
const DEFS_OPENERS: ReadonlySet<string> = new Set(['defs', 'symbol', 'linearGradient', 'radialGradient']);

/** Tags whose end can switch `inDefs` off (`SvgSaxParser.java:270`). */
const DEFS_CLOSERS: ReadonlySet<string> = new Set(['defs', 'symbol']);

/** Document depth at which a closing `defs`/`symbol` leaves defs mode (`:270-272`). */
const ROOT_CHILD_DEPTH = 1;

/**
 * @see SvgSaxParser.java:282-284 (escapeXml)
 */
function escapeXml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/**
 * @see SvgSaxParser.java:286-299 (getStyleValue)
 */
function getStyleValue(style: string, key: string): string | undefined {
  for (const part of style.split(';')) {
    const idx = part.indexOf(':');
    if (idx <= 0) continue;
    const name = part.substring(0, idx).trim();
    if (name.toLowerCase() === key.toLowerCase()) return part.substring(idx + 1).trim();
  }
  return undefined;
}

/**
 * `<tag attr="escaped" ...>` exactly as `SvgSaxParser.java:241-246` buffers it.
 * Built by concatenation: the values are escaped by {@link escapeXml}, the
 * jar's own four-entity rule, not by the SVG emitter's `attrs()` seam.
 */
function openTag(qName: string, attrs: SaxAttributes): string {
  let out = '<' + qName;
  for (let i = 0; i < attrs.length; i++) {
    out += ' ' + attrs.qName(i) + '="' + escapeXml(attrs.value(i)) + '"';
  }
  return out + '>';
}

function copyAttributes(attrs: SaxAttributes): Map<string, string> {
  const copy = new Map<string, string>();
  for (let i = 0; i < attrs.length; i++) copy.set(attrs.qName(i), attrs.value(i));
  return copy;
}

/**
 * Stores the raw XML for referenced elements so `<use>` can re-parse them
 * during render. Gradient stops and definition attributes are also captured
 * for gradient resolution.
 *
 * @see SvgSaxParser.java:186-302 (DefsCollector)
 */
export class DefsCollector implements SaxHandler {
  private readonly definitions = new Map<string, BufferedElement>();
  private depth = 0;
  private inDefs = false;
  private currentContent = '';
  private currentId: string | undefined;
  private currentTag: string | undefined;
  private currentAttrs: Map<string, string> | undefined;
  private currentElement: BufferedElement | undefined;

  /** @see SvgSaxParser.java:196-198 */
  getDefinitions(): ReadonlyMap<string, BufferedElement> {
    return this.definitions;
  }

  /** @see SvgSaxParser.java:201-248 */
  startElement(qName: string, attrs: SaxAttributes): void {
    this.depth++;
    if (DEFS_OPENERS.has(qName)) this.inDefs = true;
    if (!this.inDefs && qName !== 'symbol') return;

    const id = attrs.get('id');
    if (id !== undefined && id !== '') this.beginDefinition(id, qName, attrs);
    if (qName === 'stop' && this.currentElement !== undefined) this.collectStop(this.currentElement, attrs);
    this.currentContent += openTag(qName, attrs);
  }

  /** @see SvgSaxParser.java:210-221 */
  private beginDefinition(id: string, qName: string, attrs: SaxAttributes): void {
    this.currentId = id;
    this.currentTag = qName;
    this.currentContent = '';
    this.currentAttrs = copyAttributes(attrs);
    this.currentElement = new BufferedElement(qName, '', this.currentAttrs);
  }

  /** @see SvgSaxParser.java:224-238 (gradient stops, attribute and style forms) */
  private collectStop(element: BufferedElement, attrs: SaxAttributes): void {
    const offset = attrs.get('offset');
    let stopColor = attrs.get('stop-color');
    let stopOpacity = attrs.get('stop-opacity');
    const style = attrs.get('style');
    if (style !== undefined && style !== '') {
      stopColor ??= getStyleValue(style, 'stop-color');
      stopOpacity ??= getStyleValue(style, 'stop-opacity');
    }
    if (offset !== undefined && stopColor !== undefined) {
      element.stops.push(new GradientStop(offset, stopColor, stopOpacity));
    }
  }

  /** @see SvgSaxParser.java:251-273 */
  endElement(qName: string): void {
    if (this.inDefs) {
      this.currentContent += '</' + qName + '>';
      if (this.currentId !== undefined && this.currentTag !== undefined && this.currentTag === qName) {
        this.endDefinition();
      }
    }
    this.depth--;
    if (DEFS_CLOSERS.has(qName) && this.depth === ROOT_CHILD_DEPTH) this.inDefs = false;
  }

  /** @see SvgSaxParser.java:254-266 (definitions.put at :260) */
  private endDefinition(): void {
    if (this.currentElement !== undefined && this.currentId !== undefined && this.currentTag !== undefined) {
      const buffered = new BufferedElement(
        this.currentTag,
        this.currentContent,
        this.currentAttrs ?? new Map<string, string>(),
      );
      buffered.stops.push(...this.currentElement.stops);
      this.definitions.set(this.currentId, buffered);
    }
    this.currentId = undefined;
    this.currentTag = undefined;
    this.currentAttrs = undefined;
    this.currentElement = undefined;
  }

  /** @see SvgSaxParser.java:275-280 */
  characters(text: string): void {
    if (this.inDefs) this.currentContent += escapeXml(text);
  }
}
