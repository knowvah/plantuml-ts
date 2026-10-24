import type { ColorResolver } from '../ColorResolver.js';
import type { UGraphicWithScale } from '../../UGraphicWithScale.js';
import type { BufferedElement } from './sax-defs.js';
import type { RenderContext } from './sax-context.js';
import type { SaxAttributes, SaxHandler } from './sax-events.js';
import { parseSaxEvents } from './sax-events.js';
import {
  handleCircle,
  handleEllipse,
  handleLine,
  handlePath,
  handlePolygon,
  handlePolyline,
  handleRect,
} from './sax-shapes.js';
import { applyTransform } from './sax-style.js';
import { handleImage, handleText, handleUse } from './sax-text-image-use.js';

/**
 * Pass 2 of `SvgSaxParser`: renders SVG elements to a `UGraphic`.
 *
 * Definition blocks are skipped during this pass and `<use>` references are
 * resolved by re-parsing the buffered definition XML with the current
 * transform and inherited styling applied.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSaxParser.java:344-486
 */

/**
 * Group state holder for nested groups.
 *
 * @see SvgSaxParser.java:1337-1347 (GroupState)
 */
export class GroupState {
  readonly id: string | undefined;
  readonly className: string | undefined;
  readonly transform: string | undefined;

  constructor(attrs: SaxAttributes) {
    this.id = attrs.get('id');
    this.className = attrs.get('class');
    this.transform = attrs.get('transform');
  }
}

type ElementHandler = (ctx: RenderContext, attrs: SaxAttributes) => void;

/**
 * The `startElement` switch cases that draw (`SvgSaxParser.java:381-408`,
 * `:416-421`). `svg`, `defs`, `symbol`, `title`, `desc`, `metadata`,
 * `clipPath`, `mask`, `filter`, `pattern`, `marker`, `style`, `script` and every
 * unknown tag fall through to "ignored" (`:422-435`); `g` and `text` carry
 * handler state and are dispatched by {@link RenderHandler}.
 */
const ELEMENT_HANDLERS: ReadonlyMap<string, ElementHandler> = new Map<string, ElementHandler>([
  ['rect', handleRect],
  ['circle', handleCircle],
  ['ellipse', handleEllipse],
  ['line', handleLine],
  ['polyline', handlePolyline],
  ['polygon', handlePolygon],
  ['path', handlePath],
  ['image', handleImage],
  ['use', handleUse],
]);

const TAG_DEFS = 'defs';
const TAG_GROUP = 'g';
const TAG_TEXT = 'text';

/**
 * @see SvgSaxParser.java:344-486 (RenderHandler)
 */
export class RenderHandler implements SaxHandler, RenderContext {
  /** Current graphic (`SvgSaxParser.java:346`). */
  ugs: UGraphicWithScale;
  private readonly groupStack: GroupState[] = [];
  private readonly ugsStack: UGraphicWithScale[] = [];
  private defsDepth = 0;
  private inText = false;
  private textContent = '';
  private textAttrs: SaxAttributes | undefined;

  constructor(
    ugs: UGraphicWithScale,
    readonly colorResolver: ColorResolver,
    readonly definitions: ReadonlyMap<string, BufferedElement>,
  ) {
    this.ugs = ugs;
  }

  /** @see SvgSaxParser.java:365-436 */
  startElement(qName: string, attrs: SaxAttributes): void {
    if (qName === TAG_DEFS) {
      this.defsDepth++;
      return;
    }
    if (this.defsDepth > 0) return;
    if (qName === TAG_GROUP) {
      this.handleGroupStart(attrs);
    } else if (qName === TAG_TEXT) {
      this.inText = true;
      this.textContent = '';
      this.textAttrs = attrs;
    } else {
      ELEMENT_HANDLERS.get(qName)?.(this, attrs);
    }
  }

  /** @see SvgSaxParser.java:438-457 */
  endElement(qName: string): void {
    if (qName === TAG_DEFS && this.defsDepth > 0) {
      this.defsDepth--;
      return;
    }
    if (this.defsDepth > 0) return;
    if (qName === TAG_GROUP) {
      this.handleGroupEnd();
    } else if (qName === TAG_TEXT && this.inText) {
      this.endText();
    }
  }

  /** @see SvgSaxParser.java:445-449 */
  private endText(): void {
    if (this.textAttrs !== undefined) handleText(this, this.textAttrs, this.textContent);
    this.inText = false;
    this.textContent = '';
    this.textAttrs = undefined;
  }

  /** @see SvgSaxParser.java:458-465 */
  characters(text: string): void {
    if (this.inText) this.textContent += text;
  }

  /** @see SvgSaxParser.java:466-474 */
  private handleGroupStart(attrs: SaxAttributes): void {
    const gs = new GroupState(attrs);
    this.groupStack.push(gs);
    this.ugsStack.push(this.ugs);
    if (gs.transform !== undefined && gs.transform !== '') {
      this.ugs = applyTransform(this.ugs, gs.transform);
    }
  }

  /** @see SvgSaxParser.java:476-485 */
  private handleGroupEnd(): void {
    this.groupStack.pop();
    const previous = this.ugsStack.pop();
    if (previous !== undefined) this.ugs = previous;
  }

  /**
   * `parseSvgFragment`: renders `xml` into `ugs` through a new handler over the
   * same definitions. Failures are swallowed (upstream only logs them), never thrown.
   *
   * @see SvgSaxParser.java:898-912
   */
  renderFragment(xml: string, ugs: UGraphicWithScale): void {
    try {
      parseSaxEvents(xml, new RenderHandler(ugs, this.colorResolver, this.definitions));
    } catch {
      // `LOG.warning("Failed to parse <use> reference: ...")` (:910) is the only
      // upstream effect; src/ has no console (eslint no-console) and no warning
      // carrier reaches a RenderContext yet, so the failure is dropped here.
    }
  }
}
