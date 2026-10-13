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
 * Ported members: the 4 values, `getInv`, `getShortCode`, `fromChar`,
 * `lazzyValueOf` (added by mindmap-engine-port T1d — CommandMindMapDirection's
 * only Direction consumer), `getWBSDirection` (wbs-engine-port T0c, ported
 * over the capture groups rather than `RegexResult`).
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

/**
 * `Direction.lazzyValueOf(String)` — `TOP`/`BOTTOM` are `CommandMindMapDirection`'s
 * user-facing spelling for `UP`/`DOWN`; anything else falls through to
 * `Direction.valueOf(String)` (an enum's generated name lookup), which
 * throws `IllegalArgumentException` for a name matching none of the 4
 * values. `s` is upper-cased first (`toUpperCase()`, upstream), so a
 * lower/mixed-case enum NAME (not `TOP`/`BOTTOM`) still resolves.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Direction.java:132-139
 */
export function lazzyValueOf(s: string): Direction {
  const upper = s.toUpperCase();
  if (upper === 'TOP') return Direction.UP;
  if (upper === 'BOTTOM') return Direction.DOWN;
  if (upper === Direction.RIGHT || upper === Direction.LEFT || upper === Direction.DOWN || upper === Direction.UP)
    return upper;
  throw new Error(`No enum constant utils.Direction.${upper}`);
}

/**
 * `Direction.getWBSDirection(RegexResult)` over its inputs: `type` is the
 * `Constant.WBS_TYPE` ("TYPE") capture (`[ \t]*[*+-]+`), `dir1`/`dir2` the
 * `WBS_DIRECTION_1`/`_2` captures (`([<>])?`). Default is LEFT when `type`
 * contains `-`, else RIGHT; `getLazzy(WBS_DIRECTION, 0)` yields the first
 * non-null group (entries iterated in `data` order, `RegexResult.java:98-111`),
 * and `<` forces LEFT, `>` forces RIGHT. In the commands the two groups sit in
 * the two arms of one RegexOr, so at most one is ever set.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Direction.java:75-86
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Constant.java:40-41
 */
export function getWBSDirection(type: string, dir1: string | undefined, dir2: string | undefined): Direction {
  let direction: Direction = type.includes('-') ? Direction.LEFT : Direction.RIGHT;
  const dir = dir1 ?? dir2;
  if (dir === '<') direction = Direction.LEFT;
  else if (dir === '>') direction = Direction.RIGHT;
  return direction;
}
