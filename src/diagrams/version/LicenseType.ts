/**
 * `LicenseType` — the kind of licence a {@link LicenseInfo} records. A Java
 * enum, ported as an as-const object (enum values are their names).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseType.java
 */

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseType.java:38-40 */
export const LicenseType = {
  NONE: 'NONE',
  NAMED: 'NAMED',
  DISTRIBUTOR: 'DISTRIBUTOR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type LicenseType = (typeof LicenseType)[keyof typeof LicenseType];

/** `type == -1`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseType.java:43 */
const NONE_CODE = -1;

/** `type == 0`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseType.java:46 */
const NAMED_CODE = 0;

/** `type == 2`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseType.java:49 */
const DISTRIBUTOR_CODE = 2;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseType.java:42-54 */
export function fromInt(type: number): LicenseType {
  if (type === NONE_CODE) return LicenseType.NONE;
  if (type === NAMED_CODE) return LicenseType.NAMED;
  if (type === DISTRIBUTOR_CODE) return LicenseType.DISTRIBUTOR;
  return LicenseType.UNKNOWN;
}
