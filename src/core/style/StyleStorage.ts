import { MergeStrategy } from './MergeStrategy.js';
import type { Style } from './Style.js';
import type { StyleSignatureBasic } from './StyleSignatureBasic.js';

/**
 * StyleStorage — the declared styles of a `StyleBuilder`. Stereotype-free
 * styles are keyed by their `StyleKey` (`plain`), stereotyped ones by the
 * whole signature (`legacy`); both `LinkedHashMap`s, so a re-`put` keeps
 * the key's first position. `getStyles` iterates legacy THEN plain.
 *
 * Translation notes: Java `HashMap` keys (`equals`/`hashCode`) → the
 * canonical `keyString()` of `StyleKey`/`StyleSignatureBasic`; the
 * `AbstractCollection` view over a `ConcatIterator` (java:88-100, 122-146)
 * → a fresh array snapshot. `printMe` (stderr debug) is not ported.
 * Mutable: `put`/`putAll` write in place (the owning builder's contract).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleStorage.java:46-120
 */
export class StyleStorage {
  /** @see StyleStorage.java:49 */
  private readonly legacy = new Map<string, Style>();
  /** @see StyleStorage.java:51 */
  private readonly plain = new Map<string, Style>();

  /** @see StyleStorage.java:59-63 */
  putAll(other: StyleStorage): void {
    for (const [k, v] of other.legacy) this.legacy.set(k, v);
    for (const [k, v] of other.plain) this.plain.set(k, v);
  }

  /** `undefined` where upstream returns `null`. @see StyleStorage.java:65-73 */
  get(signature: StyleSignatureBasic): Style | undefined {
    if (signature.getStereotypes().size === 0) return this.plain.get(signature.getKey().keyString());
    return this.legacy.get(signature.keyString());
  }

  /** Filed under the style's own signature. @see StyleStorage.java:75-86 */
  put(modifiedStyle: Style): void {
    const signature = modifiedStyle.getSignature();
    if (signature.getStereotypes().size === 0) this.plain.set(signature.getKey().keyString(), modifiedStyle);
    else this.legacy.set(signature.keyString(), modifiedStyle);
  }

  /** Legacy values, then plain values. @see StyleStorage.java:88-100 */
  getStyles(): readonly Style[] {
    return [...this.legacy.values(), ...this.plain.values()];
  }

  /**
   * Every stored style whose declaration `matchAll`s `signature`, merged in
   * iteration order with `OVERWRITE_EXISTING_VALUE`; `undefined` when none.
   * @see StyleStorage.java:102-116
   */
  computeMergedStyle(signature: StyleSignatureBasic): Style | undefined {
    let mergedStyle: Style | undefined;
    for (const style of this.getStyles()) {
      if (!style.getSignature().matchAll(signature)) continue;
      mergedStyle =
        mergedStyle === undefined ? style : mergedStyle.mergeWith(style, MergeStrategy.OVERWRITE_EXISTING_VALUE);
    }
    return mergedStyle;
  }
}
