/**
 * Types shared between class-layout-generic-classifier.ts and
 * class-layout-header-geo.ts (a one-way types-leaf so neither file has to
 * import a type back from the other).
 */

/**
 * G2 N32: one resolved `{family, size, bold, italic}` font per role -- see
 * `theme.ts#classFontSize`'s doc comment for the header-vs-attribute
 * cascade `measureClassifier` builds this from.
 */
export interface ClassFontSpecs {
  header: { family: string; size: number; bold: boolean; italic: boolean };
  attribute: { family: string; size: number; bold: boolean; italic: boolean };
}
