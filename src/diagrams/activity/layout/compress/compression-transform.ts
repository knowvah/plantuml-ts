/**
 * compression-transform.ts — `klimt/compress/PiecewiseAffineTransform.java`,
 * `CompressionTransform.java` (mission `activity-klimt-compress` T2,
 * `decisions.md` D6). Pure port, no consumer yet (T3/T4 wire it in) -- the
 * aggregate `weightedScore` MUST stay exactly 42511 (mission README, stop
 * condition 6) until then.
 */
import type { Slot, SlotSet } from './slot.js';

/**
 * @see PiecewiseAffineTransform.java:38-40
 */
export interface PiecewiseAffineTransform {
  transform(v: number): number;
}

/**
 * Mirrors `klimt/compress/CompressionTransform.java`: subtracts, for every
 * removed slot starting at or before `v`, either the whole slot (`v` is
 * past its end) or the portion of it below `v` (`v` falls inside the
 * slot, so the delta clamps to `v - start`).
 * @see CompressionTransform.java:40-66
 */
export class CompressionTransform implements PiecewiseAffineTransform {
  private readonly all: readonly Slot[];

  constructor(slotSet: SlotSet) {
    this.all = slotSet.slots();
  }

  /** @see CompressionTransform.java:49-51 */
  transform(v: number): number {
    return v - this.getCompressDelta(v);
  }

  /** @see CompressionTransform.java:53-66 */
  private getCompressDelta(v: number): number {
    let result = 0;
    for (const s of this.all) {
      if (s.start > v) continue;
      if (v > s.end) {
        result += s.size();
      } else {
        result += v - s.start;
      }
    }
    return result;
  }
}
