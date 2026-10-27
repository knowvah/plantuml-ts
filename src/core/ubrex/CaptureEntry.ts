/**
 * `CaptureEntry` -- one key/value pair of a `Capture` (package-private
 * upstream).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaptureEntry.java
 */
export class CaptureEntry {
  private readonly key: string;
  private readonly value: string;

  public constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaptureEntry.java */
  public getKey(): string {
    return this.key;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaptureEntry.java */
  public getValue(): string {
    return this.value;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaptureEntry.java */
  public withPrefixedKey(prefix: string): CaptureEntry {
    return new CaptureEntry(prefix + '/' + this.key, this.value);
  }

  /** Returns `undefined` where Java returns null. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaptureEntry.java */
  public withoutPrefixedKey(prefix: string): CaptureEntry | undefined {
    if (!this.key.startsWith(prefix + '/')) return undefined;
    return new CaptureEntry(this.key.substring(prefix.length + 1), this.value);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaptureEntry.java */
  public toString(): string {
    return this.key + '=' + this.value;
  }
}
