/**
 * `RegexResult` -- result of a command pattern match, backed either by a
 * `Map<String, RegexPartialMatch>` (the regex/`RegexConcat` world) or by a
 * ubrex {@link UMatcher}. Java has two public constructors
 * (`RegexResult.java:53-62`); here the constructor is private and each is a
 * static factory: {@link RegexResult.fromMap} and
 * {@link RegexResult.fromUMatcher}. No factory from a JS `RegExpExecArray`
 * exists: the Java Map constructor receives `RegexPartialMatch` lists that
 * `RegexConcat` assembles per leaf name, which a flat group array does not
 * determine -- batch 6 builds the `Map` itself and calls `fromMap`.
 *
 * Java `null` returns are `undefined`; `UnsupportedOperationException` /
 * `IndexOutOfBoundsException` are `Error` (message = class name) /
 * `RangeError`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexResult.java
 */
import type { UMatcher } from '../ubrex/UMatcher.js';
import type { RegexPartialMatch } from './RegexPartialMatch.js';

/** `List#get(int)`: `IndexOutOfBoundsException` -> `RangeError`. */
function listGet(list: readonly string[], num: number): string {
  if (!Number.isInteger(num) || num < 0 || num >= list.length)
    throw new RangeError('Index ' + String(num) + ' out of bounds for length ' + String(list.length));
  return list[num] as string;
}

export class RegexResult {
  private readonly data: ReadonlyMap<string, RegexPartialMatch>;
  private readonly matcher: UMatcher | undefined;

  /** The two Java constructors are the factories below. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexResult.java */
  private constructor(data: ReadonlyMap<string, RegexPartialMatch>, matcher: UMatcher | undefined) {
    this.data = data;
    this.matcher = matcher;
  }

  /** `RegexResult(Map)`: `Collections.unmodifiableMap` is a view, so the map is kept by reference. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexResult.java */
  public static fromMap(data: ReadonlyMap<string, RegexPartialMatch>): RegexResult {
    return new RegexResult(data, undefined);
  }

  /** `RegexResult(UMatcher)`: `Collections.emptyMap()` data. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexResult.java */
  public static fromUMatcher(matcher: UMatcher): RegexResult {
    return new RegexResult(new Map(), matcher);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexResult.java */
  public getUMatcher(): UMatcher | undefined {
    return this.matcher;
  }

  /** Java `Map#toString` (`{k=v, k2=v2}`) when map-backed. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexResult.java */
  public toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- Java Object#toString: every UMatcher implementation has one
    if (this.matcher !== undefined) return String(this.matcher);
    return '{' + [...this.data].map(([k, v]) => k + '=' + v.toString()).join(', ') + '}';
  }

  /** `get(String)` and `get(String, int)` overloads. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexResult.java */
  public get(key: string): RegexPartialMatch | undefined;
  public get(key: string, num: number): string | undefined;
  public get(key: string, num?: number): RegexPartialMatch | string | undefined {
    if (num === undefined) {
      if (this.matcher !== undefined) throw new Error('UnsupportedOperationException');
      return this.data.get(key);
    }
    if (this.matcher !== undefined) {
      const list = this.matcher.findValuesByKey(key);
      if (list.length === 0) return undefined;
      return listGet(list, num);
    }
    const reg = this.data.get(key);
    if (reg === undefined) return undefined;

    return reg.get(num);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexResult.java */
  public getLazzy(key: string, num: number): string | undefined {
    if (this.matcher !== undefined) {
      const list = this.matcher.findFirstValuesByKeyPrefix(key);
      if (list === undefined || list.length === 0) return undefined;
      return listGet(list, num);
    }

    for (const [entryKey, match] of this.data) {
      if (!entryKey.startsWith(key)) continue;

      if (num >= match.size()) continue;

      if (match.get(num) !== undefined) return match.get(num);
    }
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexResult.java */
  public size(): number {
    if (this.matcher !== undefined) throw new Error('UnsupportedOperationException');
    return this.data.size;
  }
}
