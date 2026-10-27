/**
 * Base class for {@link PiecewiseConstant} implementations whose value is
 * constant over contiguous time segments.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/AbstractPiecewiseConstant.java:82
 */

import type { LocalDateTime } from '../../../../core/time/LocalDateTime.js';
import type { PiecewiseConstant, SegmentIterator } from './PiecewiseConstant.js';
import type { Segment } from './Segment.js';
import type { TimeDirection } from './TimeDirection.js';

/** Initial value of the infinite-loop guard (`AbstractPiecewiseConstant.java:92`). */
const MAX_ITERATIONS = 9999;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/AbstractPiecewiseConstant.java:82 */
export abstract class AbstractPiecewiseConstant implements PiecewiseConstant {
  public abstract segmentAt(instant: LocalDateTime, direction: TimeDirection): Segment;

  /**
   * Upstream is `final`. The iterator throws after 9999 `next()` calls
   * ("Infinite loop detected in PiecewiseConstant iteration", :97-98).
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/AbstractPiecewiseConstant.java:85
   */
  public iterateSegmentsFrom(instant: LocalDateTime, direction: TimeDirection): SegmentIterator {
    let current = instant;
    let counter = MAX_ITERATIONS;
    return {
      next: (): Segment => {
        if (counter <= 0) throw new Error('Infinite loop detected in PiecewiseConstant iteration');
        counter--;

        const segment = this.segmentAt(current, direction);
        current = segment.endExclusive();
        return segment;
      },
      hasNext: (): boolean => true,
    };
  }
}
