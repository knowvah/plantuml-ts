/**
 * GArrowType -- Java enum without members, as an as-const object.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/GArrowType.java:33-35
 */
export const GArrowType = {
  INCOMING: 'INCOMING',
  OUTGOING: 'OUTGOING',
} as const;
export type GArrowType = (typeof GArrowType)[keyof typeof GArrowType];
