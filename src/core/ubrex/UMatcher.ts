/**
 * `UMatcher` -- matcher facade over a ubrex pattern. The Java default method
 * `findFirstValueByKey` is the function `umatcherFindFirstValueByKey`;
 * implementers delegate to it.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UMatcher.java
 */
import type { Capture } from './Capture.js';
import type { CaptureLookup } from './CaptureLookup.js';

export interface UMatcher extends CaptureLookup {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UMatcher.java */
  startMatch(): boolean;
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UMatcher.java */
  exactMatch(): boolean;
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UMatcher.java */
  getAcceptedMatch(): string;
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UMatcher.java */
  findValuesByKey(key: string): string[];
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UMatcher.java */
  findFirstValuesByKeyPrefix(keyPrefix: string): string[] | undefined;
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UMatcher.java */
  extractByPrefix(key: string): Capture;
  /** Java default: see `umatcherFindFirstValueByKey`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UMatcher.java */
  findFirstValueByKey(key: string): string | undefined;
}

/**
 * The body of `UMatcher#findFirstValueByKey` (a Java `default` method).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UMatcher.java
 */
export function umatcherFindFirstValueByKey(matcher: UMatcher, key: string): string | undefined {
  const tmp = matcher.findValuesByKey(key);
  if (tmp.length === 0) return undefined;
  return tmp[0];
}
