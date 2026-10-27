/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantUtils.java:42
 */

import type { LocalDate } from '../../../../core/time/LocalDate.js';
import type { PiecewiseConstant } from './PiecewiseConstant.js';
import { TimeDirection } from './TimeDirection.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantUtils.java:44 */
export class PiecewiseConstantUtils {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantUtils.java:44 */
  public static isZeroOnDay(value: PiecewiseConstant, day: LocalDate): boolean {
    const startOfDay = day.atStartOfDay();
    const startOfNextDay = day.plusDays(1).atStartOfDay();

    const iterator = value.iterateSegmentsFrom(startOfDay, TimeDirection.FORWARD);

    while (iterator.hasNext()) {
      const segment = iterator.next();

      if (segment.startExclusive().isBefore(startOfNextDay) === false) break;

      if (segment.getValue().isZero() === false) return false;
    }

    return true;
  }
}
