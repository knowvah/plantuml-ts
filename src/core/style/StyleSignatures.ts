/**
 * StyleSignatures — an ordered list of {@link StyleSignature}, the fan-out
 * `StyleSignatureBasic#withTOBECHANGED`/`forStereotypeItself` build (one
 * member per stereotype label). Mutable, as upstream: `add` appends.
 *
 * `getMergedStyle(StyleBuilder)` (StyleSignatures.java:59-73: merge every
 * member's style with `MergeStrategy.KEEP_EXISTING_VALUE_OF_STEREOTYPE`,
 * throwing when empty) is T2a's — see `StyleSignature.ts`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatures.java
 */
import type { StyleSignature } from './StyleSignature.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import type { Stereostyles } from '../abel/Stereostyles.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatures.java:44 */
export class StyleSignatures implements StyleSignature {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatures.java:47 */
  private readonly all: StyleSignature[] = [];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatures.java:49-52 */
  add(signature: StyleSignature): void {
    this.all.push(signature);
  }

  /** `List.toString`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatures.java:54-57 */
  toString(): string {
    return `[${this.all.map((s) => s.toString()).join(', ')}]`;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatures.java:75-80 */
  withTOBECHANGED(_stereotype: Stereotype | undefined): StyleSignature {
    if (this.all.length === 0) throw new Error('StyleSignatures.withTOBECHANGED: empty signature list');
    throw new Error('StyleSignatures.withTOBECHANGED: unsupported');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatures.java:82-91 */
  with(stereostyles: Stereostyles): StyleSignature {
    if (this.all.length === 0) throw new Error('StyleSignatures.with: empty signature list');
    const result = new StyleSignatures();
    for (const basic of this.all) result.add(basic.with(stereostyles));

    return result;
  }
}
