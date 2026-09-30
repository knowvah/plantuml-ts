/**
 * SName — re-exported from its own module (`./SName.ts`, the full
 * 157-constant `style/SName.java` union), where the eight-name slice this
 * file used to declare was widened.
 *
 * @see net/sourceforge/plantuml/style/SName.java
 */
import type { SName } from './SName.js';

export type { SName };

/**
 * StyleSignatureBasic — minimal consumed interface for the unported
 * style-signature type (ADR-2; `style/StyleSignatureBasic.java` is 311
 * lines over `StyleKey`/`Style` machinery not in SI1 T3's closure).
 * Carries only what the static factory `of(SName...)` captures: the
 * ordered name list. `getMergedStyle`/`match`/stereotype handling join
 * the full style-engine port.
 *
 * @see net/sourceforge/plantuml/style/StyleSignatureBasic.java#of
 */
export interface StyleSignatureBasic {
  readonly names: readonly SName[];
}
