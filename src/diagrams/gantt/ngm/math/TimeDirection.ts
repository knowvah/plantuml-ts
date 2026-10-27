/**
 * Direction of time travel for a {@link Segment}. Upstream is an enum with one
 * method; the port is an as-const object plus {@link adjustBySeconds}.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/TimeDirection.java:40
 */

import type { LocalDateTime } from '../../../../core/time/LocalDateTime.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/TimeDirection.java:40 */
export const TimeDirection = {
  FORWARD: 'FORWARD',
  BACKWARD: 'BACKWARD',
} as const;
export type TimeDirection = (typeof TimeDirection)[keyof typeof TimeDirection];

/**
 * `TimeDirection#adjustBySeconds`: FORWARD adds, BACKWARD subtracts. `seconds`
 * is a Java `long` (D5): a JS `number`, exact to 2^53.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/TimeDirection.java:43
 */
export function adjustBySeconds(direction: TimeDirection, time: LocalDateTime, seconds: number): LocalDateTime {
  switch (direction) {
    case TimeDirection.FORWARD:
      return time.plusSeconds(seconds);
    case TimeDirection.BACKWARD:
      return time.minusSeconds(seconds);
    default:
      throw new Error('IllegalStateException');
  }
}
