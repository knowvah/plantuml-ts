import { BodierAbstract } from './BodierAbstract.js';
import type { Display } from '../klimt/creole/Display.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';

/**
 * BodierMap — the body provider of a `map` leaf (`LeafType.MAP`):
 * `key => value` entries, with `*-->` linked entries storing a NUL
 * value placeholder. `CucaDiagram#createLeaf` constructs one for
 * `LeafType.MAP`.
 *
 * SI1/T10 closure pull — full port (7/7 declared members; the rest is
 * inherited from `BodierAbstract`). `getBody` is an ADR-2 deferred
 * throw (its body constructs the unported `TextBlockMap`). The
 * `LinkedHashMap` becomes an insertion-ordered `Map`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierMap.java:53
 */
export class BodierMap extends BodierAbstract {
  /** @see cucadiagram/BodierMap.java:55 */
  private readonly map = new Map<string, string>();

  /** @see cucadiagram/BodierMap.java:57-60 */
  muteClassToObject(): void {
    throw new Error('UnsupportedOperationException');
  }

  /** @see cucadiagram/BodierMap.java:62 */
  private static readonly p = /(\*-+_?>)/;

  /** @see cucadiagram/BodierMap.java:64-70 */
  static getLinkedEntry(s: string): string | undefined {
    const m = BodierMap.p.exec(s);
    if (m !== null) return m[1];

    return undefined;
  }

  /** The NUL placeholder value is Java's `"\0"` — written via a code
   * escape the tooling cannot corrupt (T5's raw-NUL-byte incident).
   * @see cucadiagram/BodierMap.java:72-85 */
  addFieldOrMethod(s: string): boolean {
    const x = s.indexOf('=>');
    if (x !== -1) {
      this.map.set(s.substring(0, x).trim(), s.substring(x + 2).trim());
      return true;
    } else if (BodierMap.getLinkedEntry(s) !== undefined) {
      const link = BodierMap.getLinkedEntry(s) as string;
      const pos = s.indexOf(link);
      this.map.set(s.substring(0, pos).trim(), String.fromCharCode(0));
      return true;
    }
    return false;
  }

  /** @see cucadiagram/BodierMap.java:87-90 */
  getMethodsToDisplay(): Display {
    throw new Error('UnsupportedOperationException');
  }

  /** @see cucadiagram/BodierMap.java:92-95 */
  getFieldsToDisplay(): Display {
    throw new Error('UnsupportedOperationException');
  }

  /** @see cucadiagram/BodierMap.java:97-100 */
  hasUrl(): boolean {
    return false;
  }

  /** Deferred per SI1/ADR-2: upstream returns `new TextBlockMap(
   * fontConfiguration, skinParam, map, style.wrapWidth(),
   * style.getHorizontalAlignment())` — the map text-block renderer is
   * unported.
   * @see cucadiagram/BodierMap.java:102-108 */
  getBody(): TextBlock | null {
    void this.map;
    throw new Error(
      'deferred per SI1/ADR-2: BodierMap.getBody needs TextBlockMap, not yet ported (cucadiagram/BodierMap.java:102-108)',
    );
  }
}
