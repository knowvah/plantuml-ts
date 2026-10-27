/**
 * DayStatus — as-const object + type (memberless Java enum).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DayStatus.java
 */
export const DayStatus = {
  OPEN: 'OPEN',
  CLOSE: 'CLOSE',
} as const;

export type DayStatus = (typeof DayStatus)[keyof typeof DayStatus];
