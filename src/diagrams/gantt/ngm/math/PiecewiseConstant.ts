/**
 * A piecewise constant function defined on a {@link LocalDateTime} axis.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstant.java:52
 */

import type { LocalDateTime } from '../../../../core/time/LocalDateTime.js';
import type { Segment } from './Segment.js';
import type { TimeDirection } from './TimeDirection.js';

/**
 * Java `java.util.Iterator<Segment>` (`hasNext()` / `next()`); the iterators
 * returned here are conceptually unbounded.
 */
export interface SegmentIterator {
  hasNext(): boolean;
  next(): Segment;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstant.java:52 */
export interface PiecewiseConstant {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstant.java:54 */
  segmentAt(instant: LocalDateTime, direction: TimeDirection): Segment;

  /**
   * Segments in iteration order starting from the one containing `instant`.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstant.java:82
   */
  iterateSegmentsFrom(instant: LocalDateTime, direction: TimeDirection): SegmentIterator;
}
