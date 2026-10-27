/**
 * LabelPosition — as-const object + type (memberless Java enum).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/LabelPosition.java
 */
export const LabelPosition = {
  LEGACY: 'LEGACY',
  FIRST_COLUMN: 'FIRST_COLUMN',
  LAST_COLUMN: 'LAST_COLUMN',
} as const;

export type LabelPosition = (typeof LabelPosition)[keyof typeof LabelPosition];
