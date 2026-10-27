/**
 * `CaptureLookup` -- read access to captured values. Java `null` is `undefined`.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaptureLookup.java
 */
export interface CaptureLookup {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaptureLookup.java */
  findFirstValueByKey(key: string): string | undefined;
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaptureLookup.java */
  findValuesByKey(key: string): string[];
}
