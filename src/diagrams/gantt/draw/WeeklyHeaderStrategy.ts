/**
 * Weekly header numbering mode (upstream enum, ordinal order).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/WeeklyHeaderStrategy.java
 */
export const WeeklyHeaderStrategy = {
  WEEK_OF_YEAR: 'WEEK_OF_YEAR',
  DAY_OF_MONTH: 'DAY_OF_MONTH',
  FROM_N: 'FROM_N',
} as const;
export type WeeklyHeaderStrategy = (typeof WeeklyHeaderStrategy)[keyof typeof WeeklyHeaderStrategy];
