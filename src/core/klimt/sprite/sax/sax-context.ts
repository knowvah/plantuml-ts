import type { ColorResolver } from '../ColorResolver.js';
import type { UGraphicWithScale } from '../../UGraphicWithScale.js';
import type { BufferedElement } from './sax-defs.js';

/**
 * What every `RenderHandler` helper reads off its owning handler. Upstream's
 * `handleRect`/`handleText`/`handleUse`... are instance methods of the private
 * `RenderHandler` class and read its `ugs`, `colorResolver` and `definitions`
 * fields directly; the port splits those methods across modules (one per
 * upstream section), so the three fields and `parseSvgFragment` travel as this
 * context instead (plans/sequence-divergence-drive-3 batch-4 T4b).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSaxParser.java:344-364
 */
export interface RenderContext {
  /** The current graphic; replaced at `<g transform>` and restored at `</g>`
   *  (`SvgSaxParser.java:346`, `:466-486`). */
  ugs: UGraphicWithScale;
  /** @see SvgSaxParser.java:347 */
  readonly colorResolver: ColorResolver;
  /** Pass-1 definitions by id (`SvgSaxParser.java:348`). */
  readonly definitions: ReadonlyMap<string, BufferedElement>;
  /**
   * `parseSvgFragment`: a new handler over the same definitions renders `xml`
   * into `ugs`. A parse or handler failure is swallowed, as upstream's
   * `LOG.warning` does, and never thrown.
   *
   * @see SvgSaxParser.java:898-912
   */
  renderFragment(xml: string, ugs: UGraphicWithScale): void;
}
