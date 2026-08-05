import { Direction } from './Direction.js';

/**
 * Position — where a note (or similar satellite) sits relative to its
 * subject (`utils/Position.java`).
 *
 * SI1/T5 consumed-slice LOCAL port: `Entity#addNote`/`getNotes` and
 * `CucaNote` carry one. Upstream home is `utils/` — move to
 * `src/core/utils/Position.ts` when that package fills out.
 *
 * Ported members: the 4 values, `fromString`, `reverseDirection`.
 * Omitted (batch-1 blocked-member precedent, revisit when consumers
 * land): `withRankdir` (needs `klimt/geom/Rankdir`, unported — the same
 * blocker batch-1 documented for `EntityPosition.drawSymbol`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Position.java:43
 */
export const Position = {
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
  BOTTOM: 'BOTTOM',
  TOP: 'TOP',
} as const;
export type Position = (typeof Position)[keyof typeof Position];

/** `Position.fromString(String)` — case-insensitive `valueOf`. Throws on
 * an unknown name exactly where Java's `valueOf` would.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Position.java:45-47 */
export function fromString(s: string): Position {
  const upper = s.toUpperCase();
  if (upper in Position) return Position[upper as keyof typeof Position];
  throw new Error(`IllegalArgumentException: No enum constant Position.${upper}`);
}

/** `Position#reverseDirection()` — LEFT→RIGHT, RIGHT→LEFT; TOP/BOTTOM are
 * unsupported (upstream `UnsupportedOperationException`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Position.java:66-74 */
export function reverseDirection(position: Position): Direction {
  if (position === Position.LEFT) return Direction.RIGHT;
  if (position === Position.RIGHT) return Direction.LEFT;
  throw new Error('UnsupportedOperationException');
}
