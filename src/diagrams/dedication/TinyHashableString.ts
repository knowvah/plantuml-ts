/**
 * `TinyHashableString` — the line `Dedications.get` hands every dedication.
 * `tinyHash` (java:53-59, `Noise.shortHash` over `Dedication.N`) is read only
 * by `DedicationEncrypted`, which is out of scope (decisions.md D4), so it and
 * its cache field are not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/TinyHashableString.java
 */

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/TinyHashableString.java:40 */
export class TinyHashableString {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/TinyHashableString.java:45-47 */
  constructor(private readonly sentence: string) {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/TinyHashableString.java:49-51 */
  getSentence(): string {
    return this.sentence;
  }
}
