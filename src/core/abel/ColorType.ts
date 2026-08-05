/**
 * ColorType — which slot of an element's color set a color applies to
 * (`klimt/color/ColorType.java`).
 *
 * SI1/T5 consumed-slice LOCAL port (full: 5 values + `getType`):
 * `Colors`' map is keyed by it and `Entity#setSpecificColorTOBEREMOVED`
 * takes one. Upstream home is `klimt/color/` — move to
 * `src/core/klimt/color/ColorType.ts` when the full `Colors` port lands
 * there.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorType.java:38
 */
export const ColorType = {
  TEXT: 'TEXT',
  LINE: 'LINE',
  BACK: 'BACK',
  HEADER: 'HEADER',
  ARROW: 'ARROW',
} as const;
export type ColorType = (typeof ColorType)[keyof typeof ColorType];

/** `ColorType.getType(String)` — strips anything from the first `.` and
 * resolves case-insensitively; throws on an unknown name exactly where
 * Java's `valueOf` would.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorType.java:41-48 */
export function getType(s: string): ColorType {
  const x = s.indexOf('.');
  if (x !== -1) s = s.substring(0, x);

  const key = s.toUpperCase();
  if (key in ColorType) return ColorType[key as keyof typeof ColorType];
  throw new Error(`IllegalArgumentException: No enum constant ColorType.${key}`);
}
