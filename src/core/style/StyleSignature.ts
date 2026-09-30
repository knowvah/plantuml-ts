/**
 * StyleSignature — the common interface of a single signature
 * ({@link StyleSignatureBasic}) and a fan-out list of them
 * ({@link StyleSignatures}).
 *
 * Member not carried yet:
 * - the `default withTOBECHANGED(Stereogroup)` overload
 *   (StyleSignature.java:50-54) — `stereo/Stereogroup.java` has no port;
 *   it is `stereogroup == null ? this : withTOBECHANGED(stereogroup
 *   .buildStereotype())`, to be added with `Stereogroup`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java
 */
import type { Stereotype } from '../stereo/Stereotype.js';
import type { Stereostyles } from '../abel/Stereostyles.js';
import type { Style } from './Style.js';
import type { StyleBuilder } from './StyleBuilder.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java:44 */
export const STAR = '*';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java:42 */
export interface StyleSignature {
  /** `Object#toString`, overridden by both implementors
   *  (StyleSignatureBasic.java:59-62, StyleSignatures.java:54-57). */
  toString(): string;

  /** `undefined` where upstream returns `null`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java:46 */
  getMergedStyle(styleBuilder: StyleBuilder | undefined): Style | undefined;
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java:48 */
  withTOBECHANGED(stereotype: Stereotype | undefined): StyleSignature;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignature.java:56 */
  with(stereostyles: Stereostyles): StyleSignature;
}
