import type { Bodier } from './Bodier.js';
import type { Display } from '../klimt/creole/Display.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { Entity } from '../abel/Entity.js';

/**
 * JsonValue — ADR-2 opaque brand for `json/JsonValue.java` (the
 * vendored minimal-json model). `BodierJSon` only STORES one and pipes
 * it into the (unported) `TextBlockCucaJSon` renderer — the
 * `command/CommandExecutionResult.ts` `AbstractDiagram` precedent. The
 * json package port should move this to `src/core/json/` and widen it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/json/JsonValue.java
 */
export interface JsonValue {
  /** TS-only nominal brand; never assigned. No member is consumed. */
  readonly __jsonValueBrand?: never;
}

/**
 * BodierJSon — the body provider of a `json` leaf (`LeafType.JSON`):
 * everything except carrying the JSON value is unsupported.
 * `CucaDiagram#createLeaf` constructs one for `LeafType.JSON`.
 *
 * SI1/T10 closure pull — full port (10/10 members). `getBody` is an
 * ADR-2 deferred throw (its one line constructs the unported
 * `TextBlockCucaJSon`); every other throwing member throws upstream
 * too (`UnsupportedOperationException`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierJSon.java:51
 */
export class BodierJSon implements Bodier {
  /** @see cucadiagram/BodierJSon.java:53 */
  private json: JsonValue | undefined;

  /** @see cucadiagram/BodierJSon.java:55-58 */
  muteClassToObject(): void {
    throw new Error('UnsupportedOperationException');
  }

  /** @see cucadiagram/BodierJSon.java:60-61 */
  constructor() {
    // Upstream's explicit empty constructor.
  }

  /** @see cucadiagram/BodierJSon.java:63-66 */
  setLeaf(_leaf: Entity): void {
    // Upstream's body is empty.
  }

  /** @see cucadiagram/BodierJSon.java:68-71 */
  getMethodsToDisplay(): Display {
    throw new Error('UnsupportedOperationException');
  }

  /** @see cucadiagram/BodierJSon.java:73-76 */
  getFieldsToDisplay(): Display {
    throw new Error('UnsupportedOperationException');
  }

  /** @see cucadiagram/BodierJSon.java:78-81 */
  hasUrl(): boolean {
    return false;
  }

  /** Deferred per SI1/ADR-2: upstream returns
   * `new TextBlockCucaJSon(fontConfiguration, skinParam, json,
   * style.wrapWidth())` — the JSON text-block renderer is unported.
   * @see cucadiagram/BodierJSon.java:83-87 */
  getBody(): TextBlock | null {
    throw new Error(
      'deferred per SI1/ADR-2: BodierJSon.getBody needs TextBlockCucaJSon, not yet ported (cucadiagram/BodierJSon.java:83-87)',
    );
  }

  /** @see cucadiagram/BodierJSon.java:89-92 */
  getRawBody(): readonly string[] {
    throw new Error('UnsupportedOperationException');
  }

  /** @see cucadiagram/BodierJSon.java:94-97 */
  addFieldOrMethod(_s: string): boolean {
    throw new Error('UnsupportedOperationException');
  }

  /** @see cucadiagram/BodierJSon.java:99-101 */
  setJson(json: JsonValue): void {
    this.json = json;
  }

  /** @see cucadiagram/BodierJSon.java:103-106 */
  getBestMatch(_candidate: string): string | undefined {
    void this.json;
    throw new Error('UnsupportedOperationException');
  }
}
