/**
 * Direction — the four-way direction selector (`utils/Direction.java`).
 *
 * SI1/T5 consumed-slice LOCAL port: `Entity`'s `kals` map is keyed by
 * `Direction` and `Kal#getPosition()` returns one; `Position.reverseDirection`
 * maps onto it. Upstream home is `utils/` — move this file to
 * `src/core/utils/Direction.ts` when that package fills out (this port's
 * `src/core/utils/` currently holds only `CharHidder`/`SignatureUtils`).
 *
 * As-const object + string union per project convention
 * (`src/core/skin/ActorStyle.ts`).
 *
 * Ported members: the 4 values, `getInv`, `getShortCode`, `fromChar`.
 * Omitted (batch-1 blocked-member precedent, revisit when consumers land):
 * `getWBSDirection` (needs `regex/RegexResult` + `utils/Constant`, both
 * unported preprocessor/regex machinery).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Direction.java:44
 */
export const Direction = {
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
  DOWN: 'DOWN',
  UP: 'UP',
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

/** `Direction#getInv()` — the opposite direction.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Direction.java:46-58 */
export function getInv(direction: Direction): Direction {
  switch (direction) {
    case Direction.RIGHT:
      return Direction.LEFT;
    case Direction.LEFT:
      return Direction.RIGHT;
    case Direction.DOWN:
      return Direction.UP;
    case Direction.UP:
      return Direction.DOWN;
  }
}

/** `Direction#getShortCode()` — first letter of the name.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Direction.java:60-62 */
export function getShortCode(direction: Direction): string {
  return direction.substring(0, 1);
}

/** `Direction.fromChar(char)` — `<`/`>`/`^` map to LEFT/RIGHT/UP; anything
 * else is DOWN (upstream `default:` branch).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Direction.java:64-75 */
export function fromChar(c: string): Direction {
  switch (c) {
    case '<':
      return Direction.LEFT;
    case '>':
      return Direction.RIGHT;
    case '^':
      return Direction.UP;
    default:
      return Direction.DOWN;
  }
}
