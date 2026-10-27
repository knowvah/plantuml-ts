/**
 * `Capture` -- immutable ordered key/value captures backed by a `SafeList`.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Capture.java
 */
import { CaptureEntry } from './CaptureEntry.js';
import type { CaptureLookup } from './CaptureLookup.js';
import { SafeList } from './SafeList.js';

export class Capture implements CaptureLookup {
  public static readonly EMPTY: Capture = new Capture(SafeList.createEmpty<CaptureEntry>());

  private readonly entries: SafeList<CaptureEntry>;

  private constructor(list: SafeList<CaptureEntry>) {
    this.entries = list;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Capture.java */
  public toString(): string {
    return this.entries.toString();
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Capture.java */
  public withEntry(key: string, value: string): Capture {
    return new Capture(this.entries.add(new CaptureEntry(key, value)));
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Capture.java */
  public merge(other: Capture): Capture {
    if (other === Capture.EMPTY) return this;
    if (this === Capture.EMPTY) return other;
    return new Capture(this.entries.addAll(other.entries));
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Capture.java */
  public withPrefixedKeys(prefix: string): Capture {
    return new Capture(this.entries.mapped((entry) => entry.withPrefixedKey(prefix)));
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Capture.java */
  public findValuesByKey(key: string): string[] {
    const result: string[] = [];
    for (const entry of this.entries) if (entry.getKey() === key) result.push(entry.getValue());
    return result;
  }

  /** Returns `undefined` where Java returns null. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Capture.java */
  public findFirstValuesByKeyPrefix(keyPrefix: string): string[] | undefined {
    for (const entry of this.entries)
      if (entry.getKey().startsWith(keyPrefix)) return this.findValuesByKey(entry.getKey());
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Capture.java */
  public extractByPrefix(keyPrefix: string): Capture {
    let result = Capture.EMPTY.entries;
    for (const entry of this.entries) {
      const tmp = entry.withoutPrefixedKey(keyPrefix);
      if (tmp !== undefined) result = result.add(tmp);
    }
    return new Capture(result);
  }

  /** Returns `undefined` where Java returns null. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Capture.java */
  public findFirstValueByKey(key: string): string | undefined {
    for (const entry of this.entries) if (entry.getKey() === key) return entry.getValue();
    return undefined;
  }
}
