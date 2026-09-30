/**
 * StyleSignature — the common interface of a single signature
 * ({@link StyleSignatureBasic}) and a fan-out list of them
 * ({@link StyleSignatures}).
 *
 * Members not carried yet:
 * - `getMergedStyle(StyleBuilder)` (StyleSignature.java:46) — `Style` and
 *   `StyleBuilder` are T2a's port; T2a adds it here and on both
 *   implementors (StyleSignatureBasic.java:253-259,
 *   StyleSignatures.java:59-73).
 * - the `default withTOBECHANGED(Stereogroup)` overload
 *   (StyleSignature.java:50-54) — `stereo/Stereogroup.java` has no port;
 *   it is `stereogroup == null ? this : withTOBECHANGED(stereogroup
 *   .buildStereotype())`, to be added with `Stereogroup`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java
 */
import type { Stereotype } from '../stereo/Stereotype.js';
import type { Stereostyles } from '../abel/Stereostyles.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java:44 */
export const STAR = '*';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java:42 */
export interface StyleSignature {
  /** `Object#toString`, overridden by both implementors
   *  (StyleSignatureBasic.java:59-62, StyleSignatures.java:54-57). */
  toString(): string;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java:48 */
  withTOBECHANGED(stereotype: Stereotype | undefined): StyleSignature;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java:56 */
  with(stereostyles: Stereostyles): StyleSignature;
}
