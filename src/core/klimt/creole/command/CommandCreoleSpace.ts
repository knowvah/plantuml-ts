/**
 * CommandCreoleSpace — the creole `<space:N>` / `<space:N/>` tag.
 *
 * Upstream: `klimt/creole/command/CommandCreoleSpace.java` — starter `"<s"`,
 * pattern `^(\<space:(\d+)/?\>)` (a bare `<space>` does NOT match);
 * `executeAndAdvance` parses group 2 and calls `stripe.addSpace(size)`,
 * returning group 1's length. Registered at `CommandCreoleBuilder.java:115`
 * (after Sprite, before FontFamilyChange).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleSpace.java
 */
import type { Command } from './Command.js';

/** `CommandCreoleSpace.pattern`. */
const SPACE_PATTERN = /^(<space:(\d+)\/?>)/;

/** `CommandCreoleSpace.create()`. */
export function createSpaceCommand(): Command {
  return {
    starters: ['<s'],
    matchingSize(line, pos) {
      const m = SPACE_PATTERN.exec(line.slice(pos));
      return m === null ? 0 : m[1]!.length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = SPACE_PATTERN.exec(line.slice(pos));
      if (m === null) throw new Error('IllegalStateException');
      stripe.addSpace(Number.parseInt(m[2]!, 10));
      return m[1]!.length;
    },
  };
}
