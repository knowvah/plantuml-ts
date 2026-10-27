/**
 * Integrates a load function until a total load is consumed.
 *
 * D5 (gep) long-math sites:
 * - `segmentSeconds` (:109): `Math.abs(Duration.between(...).getSeconds())`.
 *   Java `long`; a `number` is exact below 2^53 s (~2.85e8 years). The only
 *   operand that can exceed it is `LocalDateTime.MAX`
 *   (`PiecewiseConstantTimeWindow.java:127,149`), where
 *   `Duration.between(<2024>, MAX)` is ~3.1e16 s and loses low bits. Gantt inputs
 *   cannot reach it here: a nonzero rate inside an open-ended window only occurs
 *   in `OpenClose.asPiecewiseConstant` (`OpenClose.java:209-210`), which always
 *   multiplies the window by a weekday pattern (`OpenClose.java:164,203,209`), so
 *   `Segment.intersection` takes the earliest end (<= one day); a zero-rate
 *   sentinel segment `continue`s at :101-103 before the duration is computed.
 * - `loadRate.multiplyByLong`, `remainingLoad.subtract` and `divide` are
 *   `Fraction` long maths (see Fraction.ts).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/LoadIntegrator.java:44
 */

import type { LocalDateTime } from '../../../../core/time/LocalDateTime.js';
import { Duration } from '../../../../core/time/Duration.js';
import type { Load } from '../Load.js';
import { Fraction } from './Fraction.js';
import type { PiecewiseConstant } from './PiecewiseConstant.js';
import { adjustBySeconds, TimeDirection } from './TimeDirection.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/LoadIntegrator.java:44 */
export class LoadIntegrator {
  readonly #loadFunction: PiecewiseConstant;
  readonly #totalLoad: Load;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/LoadIntegrator.java:56 */
  public constructor(loadFunction: PiecewiseConstant, totalLoad: Load) {
    this.#loadFunction = loadFunction;
    this.#totalLoad = totalLoad;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/LoadIntegrator.java:61 */
  public computeEnd(start: LocalDateTime): LocalDateTime {
    return this.#integrate(start, TimeDirection.FORWARD);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/LoadIntegrator.java:78 */
  public computeStart(end: LocalDateTime): LocalDateTime {
    return this.#integrate(end, TimeDirection.BACKWARD);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/LoadIntegrator.java:89 */
  #integrate(startTime: LocalDateTime, direction: TimeDirection): LocalDateTime {
    let remainingLoad = this.#totalLoad.toSeconds();
    let currentTime = startTime;

    const iter = this.#loadFunction.iterateSegmentsFrom(startTime, direction);
    while (iter.hasNext()) {
      const segment = iter.next();

      if (remainingLoad.equals(Fraction.ZERO)) break;

      const loadRate = segment.getValue();
      if (loadRate.equals(Fraction.ZERO)) {
        currentTime = segment.endExclusive();
        continue;
      }

      // Calculate the effective start within the segment
      const effectiveStart = segment.computeClampedStart(currentTime);

      // LONG (D5): see the class comment.
      const segmentSeconds = Math.abs(Duration.between(effectiveStart, segment.endExclusive()).getSeconds());
      // Load consumed in this segment = loadRate * duration (in seconds)
      const segmentLoad = loadRate.multiplyByLong(segmentSeconds);

      if (segmentLoad.compareTo(remainingLoad) >= 0) {
        // This segment completes the work: time needed = remainingLoad / loadRate
        const secondsNeeded = remainingLoad.divide(loadRate);
        return adjustBySeconds(direction, effectiveStart, secondsNeeded.wholePart());
      }

      // Consume the entire segment
      remainingLoad = remainingLoad.subtract(segmentLoad);
      currentTime = segment.endExclusive();
    }

    return currentTime;
  }
}
