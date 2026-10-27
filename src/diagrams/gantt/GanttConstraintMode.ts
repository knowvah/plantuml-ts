/**
 * GanttConstraintMode — as-const object + type (memberless Java enum).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraintMode.java
 */
export const GanttConstraintMode = {
  IGNORE_CALENDAR: 'IGNORE_CALENDAR',
  DO_NOT_COUNT_CLOSE_DAY: 'DO_NOT_COUNT_CLOSE_DAY',
} as const;

export type GanttConstraintMode = (typeof GanttConstraintMode)[keyof typeof GanttConstraintMode];
