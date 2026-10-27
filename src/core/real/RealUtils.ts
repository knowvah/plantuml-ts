import type { Real } from './Real.js';
import { RealDeltaLive } from './RealDeltaLive.js';
import { RealImpl } from './RealImpl.js';
import { RealLine } from './RealLine.js';
import { RealMax } from './RealMax.js';
import { RealMiddle2 } from './RealMiddle2.js';
import { RealMin } from './RealMin.js';
import { castRealMoveable } from './RealMoveable.js';
import type { RealOrigin } from './RealOrigin.js';

/**
 * `RealUtils` — the public factory of the `real` package.
 *
 * The Java `max(Real...)`/`max(Collection<Real>)` overload pairs (and `min`)
 * collapse to one function taking an array: a varargs call becomes an array
 * argument, the `Collection` overload takes the same array.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealUtils.java:42-80
 */
export const RealUtils = {
  /** `RealUtils.java:44-48`. */
  createOrigin(): RealOrigin {
    const line = new RealLine();
    return new RealImpl('O', line, 0);
  },

  /** `RealUtils.java:57-59`: the offset is re-read on every resolution. */
  withLiveOffset(base: Real, offset: () => number): Real {
    return new RealDeltaLive(base, offset);
  },

  /** `RealUtils.java:61-63`: both arguments must be `RealMoveable` (cast). */
  middle(r1: Real, r2: Real): Real {
    return new RealMiddle2(castRealMoveable(r1), castRealMoveable(r2));
  },

  /** `RealUtils.java:65-71` (varargs and `Collection` overloads). */
  max(reals: readonly Real[]): Real {
    return new RealMax(reals);
  },

  /** `RealUtils.java:73-79` (varargs and `Collection` overloads). */
  min(reals: readonly Real[]): Real {
    return new RealMin(reals);
  },
} as const;
