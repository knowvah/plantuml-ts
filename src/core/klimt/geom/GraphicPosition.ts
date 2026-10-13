/**
 * `GraphicPosition` — where `GraphicStrings` places its image. An as-const
 * object rather than a TS `enum` (the project's convention for upstream enums).
 *
 * `core/error/graphic-strings.ts` keeps its own two-value string union for
 * the error pages; this is the full upstream enum the klimt port uses.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/GraphicPosition.java:38-41
 */
export const GraphicPosition = {
  BOTTOM: 'BOTTOM',
  BACKGROUND_CORNER_BOTTOM_RIGHT: 'BACKGROUND_CORNER_BOTTOM_RIGHT',
  BACKGROUND_CORNER_TOP_RIGHT: 'BACKGROUND_CORNER_TOP_RIGHT',
} as const;

export type GraphicPosition = (typeof GraphicPosition)[keyof typeof GraphicPosition];
