/**
 * NoteLinkStrategy — how a note attached to a link contributes to
 * layout sizing: fully, as a half-width placeholder that is still
 * printed, or not at all. Carried by `CucaNote` (abel/CucaNote.java —
 * T6's write-set, with `Link`).
 *
 * Upstream: abel/NoteLinkStrategy.java:41. As-const object + string
 * union per project convention (`src/core/skin/ActorStyle.ts`).
 *
 * SI1/T2 (batch 1); ADR-1.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/NoteLinkStrategy.java:41
 */
import { XDimension2D } from '../klimt/geom/XDimension2D.js';

export const NoteLinkStrategy = {
  NORMAL: 'NORMAL',
  HALF_PRINTED_FULL: 'HALF_PRINTED_FULL',
  HALF_NOT_PRINTED: 'HALF_NOT_PRINTED',
} as const;
export type NoteLinkStrategy = (typeof NoteLinkStrategy)[keyof typeof NoteLinkStrategy];

/**
 * `NoteLinkStrategy#computeDimension(double, double)` —
 * `HALF_PRINTED_FULL` halves the width, `HALF_NOT_PRINTED` collapses to
 * 0×0, `NORMAL` keeps the full dimension.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/NoteLinkStrategy.java:43-51
 */
export function computeDimension(
  strategy: NoteLinkStrategy,
  width: number,
  height: number,
): XDimension2D {
  if (strategy === NoteLinkStrategy.HALF_PRINTED_FULL) return new XDimension2D(width / 2, height);

  if (strategy === NoteLinkStrategy.HALF_NOT_PRINTED) return new XDimension2D(0, 0);

  return new XDimension2D(width, height);
}
