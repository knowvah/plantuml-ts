/**
 * PiecewiseTimeType — as-const object + type (memberless Java enum).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PiecewiseTimeType.java
 */
export const PiecewiseTimeType = {
  OPEN: 'OPEN',
  CLOSE: 'CLOSE',
} as const;

export type PiecewiseTimeType = (typeof PiecewiseTimeType)[keyof typeof PiecewiseTimeType];
