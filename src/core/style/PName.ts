/**
 * PName — every style property name of `style/PName.java`
 * (1.2026.8beta1), constant names verbatim, as a readonly
 * declaration-order array plus the string-literal union it induces (no
 * `const enum`, project convention). 30 constants, PName.java:39-70.
 * `FontWeight` (PName.java:44-45): CSS font-weight -- keywords (normal,
 * bold, lighter, bolder) or numeric values 100-900.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/PName.java
 */
export const PNAMES = [
  'Shadowing',
  'FontName',
  'FontColor',
  'FontSize',
  'FontStyle',
  'FontWeight',
  'BackGroundColor',
  'RoundCorner',
  'LineThickness',
  'DiagonalCorner',
  'HyperLinkColor',
  'HyperlinkUnderlineStyle',
  'HyperlinkUnderlineThickness',
  'HeadColor',
  'LineColor',
  'LineStyle',
  'Padding',
  'Margin',
  'MaximumWidth',
  'MinimumWidth',
  'ExportedName',
  'Image',
  'HorizontalAlignment',
  'ShowStereotype',
  'ImagePosition',
  'MarkerShape',
  'MarkerSize',
  'MarkerColor',
  'BarWidth',
  'Width',
] as const;

/** One `PName.java` constant. @see PName.java:38-70 */
export type PName = (typeof PNAMES)[number];

/**
 * `PName.getFromName(String, StyleScheme)` (PName.java:72-78): the first
 * constant whose `name()` equals `name` ignoring case; `undefined` where
 * upstream returns `null`. The `scheme` argument is unused upstream too;
 * it is kept for signature parity and typed `unknown` because
 * `StyleScheme` is ported by T3a (`style/parser/StyleScheme.ts`).
 */
export function getFromName(name: string, _scheme: unknown): PName | undefined {
  const lower = name.toLowerCase();
  return PNAMES.find((prop) => prop.toLowerCase() === lower);
}
