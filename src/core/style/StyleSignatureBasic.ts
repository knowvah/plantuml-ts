/**
 * SName — minimal consumed slice of the unported style-name enum
 * (ADR-2; `style/SName.java` is a 217-member enum). Values are the
 * Java enum CONSTANT names verbatim (trailing underscores included) —
 * upstream's `StyleSignatureBasic#clean` lowercases and strips `_`/`.`
 * when matching, so the constant name is the identity to preserve.
 * Currently only the eight names `VisibilityModifier#getStyleSignature`
 * emits; widen this union as later ports consume more of `SName.java`.
 * Split out of `VisibilityModifier.ts` along the upstream file boundary
 * (500-line cap; SI1 push-forward, journaled).
 *
 * @see net/sourceforge/plantuml/style/SName.java
 */
export type SName =
  | 'root'
  | 'element'
  | 'visibilityIcon'
  | 'IEMandatory'
  | 'public_'
  | 'private_'
  | 'protected_'
  | 'package_';

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
