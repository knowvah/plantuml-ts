/**
 * StyleKey — the sname set, depth level and star flag of a style
 * signature; the key `StyleStorage` files stereotype-free styles under
 * (`StyleStorage.java:69-70,81-82`).
 *
 * `EnumSet<SName>` → an insertion-ordered `ReadonlySet<SName>`. Upstream
 * only iterates the set in `toString` (and `equals`/`hashCode`, which are
 * order-free), so {@link StyleKey.toString} sorts by SName ordinal to
 * reproduce `EnumSet` iteration, and {@link StyleKey.keyString} (the
 * `hashCode` stand-in for JS `Map` keys) uses the same canonical order.
 * Immutable, as upstream: every `add*` returns a new key.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java
 */
import { SNAMES } from './SName.js';
import type { SName } from './SName.js';
import type { Url } from '../url/Url.js';

/** SName declaration order — `Enum.ordinal()`, which `EnumSet` iterates in. */
const ORDINAL: ReadonlyMap<SName, number> = new Map(SNAMES.map((name, i) => [name, i]));

/** `EnumSet` iteration order: ascending ordinal. */
export function enumSetOrder(snames: ReadonlySet<SName>): SName[] {
  return [...snames].sort((a, b) => (ORDINAL.get(a) ?? 0) - (ORDINAL.get(b) ?? 0));
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:43 */
export class StyleKey {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:49-53 */
  private constructor(
    /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:45 */
    readonly snames: ReadonlySet<SName>,
    /** `-1` = no level (StyleKey.java:56,99). @see StyleKey.java:47 */
    readonly level: number,
    /** Upstream spelling kept. @see StyleKey.java:46 */
    readonly isStared: boolean,
  ) {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:55-57 */
  static empty(): StyleKey {
    return new StyleKey(new Set(), -1, false);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:59-67 */
  toString(): string {
    let sb = `[${enumSetOrder(this.snames).join(', ')}] `;
    if (this.level !== -1) sb += ` ${String(this.level)}`;
    if (this.isStared) sb += ' (*)';
    return sb;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:69-78 */
  addClickable(url: Url | undefined): StyleKey {
    if (url === undefined) return this;

    return this.addSName('clickable');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:80-82 */
  addLevel(level: number): StyleKey {
    return new StyleKey(this.snames, level, this.isStared);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:84-88 */
  addSName(name: SName): StyleKey {
    const result = new Set(this.snames);
    result.add(name);
    return new StyleKey(result, this.level, this.isStared);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:90-92 */
  addStar(): StyleKey {
    return new StyleKey(this.snames, this.level, true);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:94-100 */
  static of(...names: SName[]): StyleKey {
    return new StyleKey(new Set(names), -1, false);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:102-108 */
  mergeWith(other: StyleKey): StyleKey {
    const result1 = new Set(this.snames);
    for (const name of other.snames) result1.add(name);

    return new StyleKey(result1, Math.max(this.level, other.level), this.isStared || other.isStared);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleKey.java:110-118 */
  equals(other: StyleKey): boolean {
    if (this === other) return true;
    return this.keyString() === other.keyString();
  }

  /**
   * `hashCode` stand-in (`Objects.hash(snames, isStared, level)`,
   * StyleKey.java:120-130): a canonical string, equal exactly when
   * {@link equals} holds, for use as a JS `Map` key.
   */
  keyString(): string {
    return JSON.stringify([enumSetOrder(this.snames), this.isStared, this.level]);
  }
}
