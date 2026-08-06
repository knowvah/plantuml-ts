import type { Paint } from '../paint.js';

/**
 * ColorParam — minimal consumed interface for the unported skin enum
 * (ADR-2: `skin/ColorParam.java` is 121 lines over `HColor`/`ColorType`
 * machinery not in SI1 T3's closure; only the shape
 * `VisibilityModifier`'s accessors hand to skinparam color resolution
 * is defined here). Split out of `VisibilityModifier.ts` along the
 * upstream file boundary (500-line cap; SI1 push-forward, journaled).
 *
 * Upstream accessor methods flatten to readonly fields (`name()` ->
 * `name`, `getDefaultValue()` -> `defaultValue`, `isBackground()` ->
 * `isBackground`); `getColorType()` is omitted — it is `null` for every
 * icon constant below. `HColor` defaults map to `Paint` hex strings
 * (the established seam — see `paint.ts` / `Back.ts`). The other ~40
 * enum constants join whichever mission ports the full skinparam color
 * table.
 *
 * @see net/sourceforge/plantuml/skin/ColorParam.java
 */
export interface ColorParam {
  readonly name: string;
  readonly defaultValue: Paint;
  readonly isBackground: boolean;
}

/**
 * The nine icon `ColorParam` constants `VisibilityModifier` consumes —
 * all built by upstream's single-arg constructor (`isBackground=false`,
 * `colorType=null`); default hexes are `HColors.java:99-107` (`BLACK`
 * is `#000000`, HColors.java:86).
 *
 * @see net/sourceforge/plantuml/skin/ColorParam.java:66-69
 */
export const ColorParam = {
  iconPrivate: { name: 'iconPrivate', defaultValue: '#C82930', isBackground: false },
  iconPrivateBackground: { name: 'iconPrivateBackground', defaultValue: '#F24D5C', isBackground: false },
  iconPackage: { name: 'iconPackage', defaultValue: '#1963A0', isBackground: false },
  iconPackageBackground: { name: 'iconPackageBackground', defaultValue: '#4177AF', isBackground: false },
  iconProtected: { name: 'iconProtected', defaultValue: '#B38D22', isBackground: false },
  iconProtectedBackground: { name: 'iconProtectedBackground', defaultValue: '#FFFF44', isBackground: false },
  iconPublic: { name: 'iconPublic', defaultValue: '#038048', isBackground: false },
  iconPublicBackground: { name: 'iconPublicBackground', defaultValue: '#84BE84', isBackground: false },
  iconIEMandatory: { name: 'iconIEMandatory', defaultValue: '#000000', isBackground: false },
} as const satisfies Record<string, ColorParam>;
