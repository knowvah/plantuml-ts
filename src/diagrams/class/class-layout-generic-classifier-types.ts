/**
 * Types shared between class-layout-generic-classifier.ts and
 * class-layout-header-geo.ts (a one-way types-leaf so neither file has to
 * import a type back from the other).
 */
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { GuillemetPair } from './class-stereotype.js';

/**
 * G2 N32: one resolved `{family, size, bold, italic}` font per role -- see
 * `theme.ts#classFontSize`'s doc comment for the header-vs-attribute
 * cascade `measureClassifier` builds this from.
 */
export interface ClassFontSpecs {
  // cdd6 T3g: `hyperlinkColor` -- `class-layout-fonts.ts#hyperlinkColorField`.
  header: { family: string; size: number; bold: boolean; italic: boolean; hyperlinkColor?: string };
  attribute: { family: string; size: number; bold: boolean; italic: boolean; hyperlinkColor?: string };
}

/** cdd7 T2b: moved from `class-layout-generic-classifier.ts` (500-line cap)
 *  -- a pure move, re-exported from there. */
/** Every field `measureGenericClassifier` threads down to size the
 *  generic name+members box -- see each field's own doc comment for the
 *  upstream override it resolves. */
export interface MeasureGenericClassifierOptions {
  sprites: SpriteRegistry | undefined;
  guillemet?: GuillemetPair | undefined;
  /** G2 N38: `skinparam circledCharacterFontSize`/`circledCharacterRadius`
   *  -- pre-resolved by the caller (`measureClassifier`, which has
   *  `theme`), since this function has no `Theme` param of its own. */
  badgeRadius: number;
  /** G2 N39: `skinparam classStereotypeFontSize`/`FontName`/`FontStyle`
   *  -- pre-resolved by the caller, mirroring `badgeRadius`'s own
   *  precedent above. */
  stereoFont: { family: string; size: number; bold: boolean; italic: boolean };
  /** G2 N58 item 40: `skinparam style strictuml` -- pre-resolved by the
   *  caller, mirroring `badgeRadius`'s own "resolve once, pass down"
   *  precedent above. */
  strictUml: boolean;
  /** cdd3-T25 (E3-3): `skinparam genericDisplay old` -- pre-resolved by
   *  the caller, same precedent as `strictUml` above. */
  genericDisplayOld: boolean;
  /** G2 N65 item 35: `<style> class { MaximumWidth N } }` -- pre-resolved
   *  by the caller, mirroring `badgeRadius`'s own "resolve once, pass
   *  down" precedent above. `0` = no wrap. */
  headerMaxWidth: number;
  memberMaxWidth: number;
  /** A2s F-D mechanism A7: `skinparam minClassWidth` / `<style> MinimumWidth`
   *  (`PName.MinimumWidth`) -- pre-resolved by the caller
   *  (`measureClassifier`, via `resolveElementMinimumWidth(theme, 'class')`),
   *  mirroring `badgeRadius`'s "resolve once, pass down" precedent. Floors
   *  the box width AFTER `max(header, body)`, BEFORE the header rows are
   *  placed (upstream `HeaderLayout#drawU` centers against the FINAL width).
   *  Optional; absent/0 = no floor (upstream's own default).
   *  @see ~/git/plantuml/.../svek/image/EntityImageClass.java:104-106 */
  minClassWidth?: number;
  /** A2s F-G mechanism A13 / cdd5-T5e: `skinparam classAttributeIconSize`
   *  (`SkinParam#classAttributeIconSize()` = `getAsInt(..., 10)`,
   *  SkinParam.java:554-556) -- pre-resolved by the caller
   *  (`measureClassifier`, from `theme.classAttributeIconSize`), mirroring
   *  `badgeRadius`'s precedent. `0` disables a member row's small icon
   *  (`MethodsOrFieldsArea#hasSmallIcon` java:125-127); ALSO threaded to
   *  the header's OWN icon reservation (`class-layout-header-geo.ts`).
   *  Absent = upstream default 10 = icons on. */
  classAttributeIconSize?: number | undefined;
  /** cdd2-T11 (Q-1): the two floors `EntityImageClass#calculateDimensionSlow`
   *  applies AFTER `minClassWidth` -- `paramSameClassWidth` and
   *  `getKalWidth() * 1.3` (`svek/image/EntityImageClass.java:108-113`).
   *  Both need every classifier (or every `Kal`) first, so they reach here
   *  only through {@link widenMeasuredClassifier}'s re-measure; never set by
   *  `measureClassifier`. Absent = 0. */
  widthFloor?: number;
}
