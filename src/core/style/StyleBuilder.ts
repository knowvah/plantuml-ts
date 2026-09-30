import type { AutomaticCounter } from './AutomaticCounter.js';
import { MergeStrategy } from './MergeStrategy.js';
import type { PName } from './PName.js';
import { Style } from './Style.js';
import { StyleSignatureBasic } from './StyleSignatureBasic.js';
import { StyleStorage } from './StyleStorage.js';
import type { Value } from './Value.js';

/**
 * StyleBuilder — a diagram's style storage plus the priority counter its
 * parser draws from, and the two merge queries every element resolves its
 * style with.
 *
 * Concurrency / mutation contract (JS is single-threaded; upstream's
 * `ConcurrentHashMap` cache becomes a plain `Map`): `muteStyle` and
 * `cloneMe` return NEW builders (fresh cache, copied storage and counter);
 * `loadInternal` and `getNextInt` mutate this builder in place.
 * `getMergedStyle` memoizes per builder instance only — no module-level
 * state — keyed by signature value (`keyString`). As upstream, the cache
 * is not invalidated by `loadInternal`: a signature resolved before a
 * later `loadInternal` keeps its earlier result (StyleBuilder.java:106-117
 * never touches `mergedStyleCache`). A `null`/`undefined` result is not
 * cached (`ConcurrentHashMap.computeIfAbsent` records no mapping for a
 * null value).
 *
 * Not ported: `printMe` (stderr) and `printedForLog`, which only gates a
 * `Log.info` line (java:49, 57-59, 129-131, 140-142).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleBuilder.java:47-163
 */
export class StyleBuilder implements AutomaticCounter {
  /** @see StyleBuilder.java:49 */
  private readonly storage = new StyleStorage();
  /** @see StyleBuilder.java:51 */
  private counter = 0;
  /** @see StyleBuilder.java:124 */
  private readonly mergedStyleCache = new Map<string, Style>();

  /** Storage and counter copied into a new builder. @see StyleBuilder.java:65-71 */
  cloneMe(): StyleBuilder {
    const result = new StyleBuilder();
    result.storage.putAll(this.storage);
    result.counter = this.counter;
    return result;
  }

  /**
   * The stored style of the lowercased stereotype `name`, else an empty
   * style on that signature; a name containing `*` is rejected.
   * @see StyleBuilder.java:73-84
   */
  createStyleStereotype(name: string): Style {
    if (name.includes(StyleSignatureBasic.STAR)) throw new Error('IllegalArgumentException');

    const signature = StyleSignatureBasic.createStereotype(name.toLowerCase());
    return this.storage.get(signature) ?? new Style(signature, new Map<PName, Value>());
  }

  /**
   * A new builder over a copy of this storage, with each style stored or
   * merged (`OVERWRITE_EXISTING_VALUE`) into its signature's slot, in order.
   * @see StyleBuilder.java:86-104
   */
  muteStyle(modifiedStyles: Iterable<Style>): StyleBuilder {
    const result = new StyleBuilder();
    result.counter = this.counter;
    result.storage.putAll(this.storage);

    for (const modifiedStyle of modifiedStyles) {
      const orig = result.storage.get(modifiedStyle.getSignature());
      if (orig === undefined) result.storage.put(modifiedStyle);
      else result.storage.put(orig.mergeWith(modifiedStyle, MergeStrategy.OVERWRITE_EXISTING_VALUE));
    }
    return result;
  }

  /** In place; a starred signature is rejected. @see StyleBuilder.java:106-117 */
  loadInternal(signature: StyleSignatureBasic, newStyle: Style): void {
    if (signature.isStarred()) throw new Error('IllegalArgumentException');

    const orig = this.storage.get(signature);
    if (orig === undefined) this.storage.put(newStyle);
    else this.storage.put(orig.mergeWith(newStyle, MergeStrategy.OVERWRITE_EXISTING_VALUE));
  }

  /** `++counter`. @see StyleBuilder.java:119-122 */
  getNextInt(): number {
    return ++this.counter;
  }

  /** Every matching declaration merged; memoized per signature value. @see StyleBuilder.java:126-137 */
  getMergedStyle(signature: StyleSignatureBasic): Style | undefined {
    const key = signature.keyString();
    const cached = this.mergedStyleCache.get(key);
    if (cached !== undefined) return cached;

    const result = this.storage.computeMergedStyle(signature);
    if (result !== undefined) this.mergedStyleCache.set(key, result);
    return result;
  }

  /**
   * As `getMergedStyle`, uncached, with every STARRED matching declaration
   * lifted by `deltaPriority` first; `undefined` when nothing matches.
   * @see StyleBuilder.java:139-160
   */
  getMergedStyleSpecial(signature: StyleSignatureBasic, deltaPriority: number): Style | undefined {
    let mergedStyle: Style | undefined;
    for (const style of this.storage.getStyles()) {
      const key = style.getSignature();
      if (!key.matchAll(signature)) continue;

      const tmp = key.isStarred() ? style.deltaPriority(deltaPriority) : style;
      mergedStyle =
        mergedStyle === undefined ? tmp : mergedStyle.mergeWith(tmp, MergeStrategy.OVERWRITE_EXISTING_VALUE);
    }
    return mergedStyle;
  }
}
